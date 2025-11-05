
        const tickets = [
            "I forgot my password, how to reset it?",
            "I can't log in, as password is incorrect.",
            "How to see leave balance?"
        ];

        let ticketHistory = [];
        let volumeChart = null;
        let categoryChart = null;
        let priorityChart = null;
        let currentTimeRange = '24h';

        function initializeHistoricalData() {
            const now = new Date();
            const categories = ['Password Reset', 'Account Access', 'Leave Management', 'System Error', 'Feature Request'];
            const priorities = ['High', 'Medium', 'Low'];
            
            for (let i = 90; i >= 0; i--) {
                const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
                const baseVolume = 15 + Math.floor(Math.random() * 10);
                const weekendFactor = (date.getDay() === 0 || date.getDay() === 6) ? 0.4 : 1;
                const volume = Math.floor(baseVolume * weekendFactor);
                
                for (let j = 0; j < volume; j++) {
                    ticketHistory.push({
                        timestamp: date.getTime(),
                        category: categories[Math.floor(Math.random() * categories.length)],
                        priority: priorities[Math.floor(Math.random() * priorities.length)],
                        text: `Simulated ticket ${i}-${j}`
                    });
                }
            }
        }

        function getTimeRangeData(range) {
            const now = Date.now();
            const ranges = {
                '24h': 24 * 60 * 60 * 1000,
                '7d': 7 * 24 * 60 * 60 * 1000,
                '30d': 30 * 24 * 60 * 60 * 1000,
                '90d': 90 * 24 * 60 * 60 * 1000
            };
            
            const cutoff = now - ranges[range];
            return ticketHistory.filter(t => t.timestamp >= cutoff);
        }

        function aggregateDataByTime(data, range) {
            const intervals = {
                '24h': 60 * 60 * 1000,
                '7d': 24 * 60 * 60 * 1000,
                '30d': 24 * 60 * 60 * 1000,
                '90d': 7 * 24 * 60 * 60 * 1000
            };
            
            const interval = intervals[range];
            const grouped = {};
            
            data.forEach(ticket => {
                const timeKey = Math.floor(ticket.timestamp / interval) * interval;
                if (!grouped[timeKey]) {
                    grouped[timeKey] = [];
                }
                grouped[timeKey].push(ticket);
            });
            
            return Object.keys(grouped)
                .sort((a, b) => a - b)
                .map(key => ({
                    time: parseInt(key),
                    count: grouped[key].length,
                    tickets: grouped[key]
                }));
        }

        function detectTrends(data) {
            if (data.length < 2) return { trend: 'stable', change: 0 };
            
            const mid = Math.floor(data.length / 2);
            const firstHalf = data.slice(0, mid);
            const secondHalf = data.slice(mid);
            
            const avgFirst = firstHalf.reduce((sum, d) => sum + d.count, 0) / firstHalf.length;
            const avgSecond = secondHalf.reduce((sum, d) => sum + d.count, 0) / secondHalf.length;
            
            const change = ((avgSecond - avgFirst) / avgFirst) * 100;
            
            return {
                trend: change > 10 ? 'increasing' : change < -10 ? 'decreasing' : 'stable',
                change: Math.abs(change).toFixed(1)
            };
        }

        function detectSpikes(data) {
            if (data.length < 3) return [];
            
            const mean = data.reduce((sum, d) => sum + d.count, 0) / data.length;
            const variance = data.reduce((sum, d) => sum + Math.pow(d.count - mean, 2), 0) / data.length;
            const stdDev = Math.sqrt(variance);
            
            const threshold = mean + (2 * stdDev);
            
            return data
                .filter(d => d.count > threshold)
                .map(d => ({
                    time: d.time,
                    count: d.count,
                    threshold: threshold.toFixed(1)
                }));
        }

        function predictNextPeriod(data) {
            if (data.length < 7) return null;
            
            const recent = data.slice(-7);
            const avg = recent.reduce((sum, d) => sum + d.count, 0) / recent.length;
            
            const trend = detectTrends(data);
            const trendFactor = trend.trend === 'increasing' ? 1.1 : trend.trend === 'decreasing' ? 0.9 : 1;
            
            return Math.round(avg * trendFactor);
        }

        function getCategoryTrends(range) {
            const data = getTimeRangeData(range);
            const categoryCounts = {};
            
            data.forEach(ticket => {
                categoryCounts[ticket.category] = (categoryCounts[ticket.category] || 0) + 1;
            });
            
            return Object.entries(categoryCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);
        }

        function changeTimeRange(range, event) {
        currentTimeRange = range;
        document.querySelectorAll('.time-filter button').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        updateAnalytics();
        }


        function addTicket() {
            const input = document.getElementById('ticketInput');
            const ticket = input.value.trim();
            
            if (ticket) {
                tickets.push(ticket);
                renderTicketList();
                input.value = '';
            }
        }

        function removeTicket(index) {
            if (index >= 3) {
                tickets.splice(index, 1);
                renderTicketList();
            }
        }

        function renderTicketList() {
            const container = document.getElementById('ticketList');
            const addedTickets = tickets.slice(3);
            
            if (addedTickets.length === 0) {
                container.innerHTML = '<p style="color: var(--color-text-secondary); font-size: 12px;">No additional tickets added</p>';
                return;
            }
            
            container.innerHTML = addedTickets.map((ticket, i) => `
                <div class="ticket-item">
                    <span class="ticket-item-text">${ticket}</span>
                    <button class="btn-remove" onclick="removeTicket(${i + 3})">×</button>
                </div>
            `).join('');
        }

        async function analyzeTickets() {
            const apiKey = document.getElementById('apiKey').value.trim();
            
            if (!apiKey) {
                showError('Please enter a valid Gemini API key');
                return;
            }

            if (tickets.length === 0) {
                showError('Please add at least one ticket');
                return;
            }

            document.getElementById('loading').classList.add('active');
            document.getElementById('error').innerHTML = '';
            document.getElementById('analysisSection').style.display = 'none';
            document.getElementById('analyticsDashboard').style.display = 'none';

            try {
                const clusters = await classifyAndClusterTickets(tickets, apiKey);
                await generateResponsesForClusters(clusters, apiKey);
                
                clusters.forEach(cluster => {
                    cluster.tickets.forEach(ticket => {
                        ticketHistory.push({
                            timestamp: Date.now(),
                            category: cluster.category,
                            priority: cluster.priority,
                            text: ticket.text
                        });
                    });
                });
                
                displayResults(clusters);
                updateAnalytics();
                
                document.getElementById('analyticsDashboard').style.display = 'block';
            } catch (error) {
                showError(error.message);
            } finally {
                document.getElementById('loading').classList.remove('active');
            }
        }

        async function classifyAndClusterTickets(tickets, apiKey) {
            const prompt = `You are an expert AI system for customer support ticket analysis. Analyze these support tickets and group them into semantic clusters based on their underlying intent and topic.

Tickets:
${tickets.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Instructions:
1. Identify the core intent/topic of each ticket
2. Group tickets with similar intents together into clusters
3. Provide a descriptive category name for each cluster
4. Assign a priority level (High/Medium/Low) based on urgency

Return ONLY a valid JSON array with this exact structure:
[
  {
    "category": "Category Name",
    "priority": "High/Medium/Low",
    "tickets": [
      {"id": 1, "text": "ticket text", "intent": "brief intent description"}
    ]
  }
]

Requirements:
- Be specific with category names (e.g., "Password Reset & Authentication" not just "Login")
- Group tickets by semantic similarity, not just keywords
- Each ticket should appear in exactly one cluster
- Priority should reflect business impact and urgency`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        temperature: 0.3,
                        maxOutputTokens: 2048
                    }
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Failed to classify tickets');
            }

            const data = await response.json();
            const text = data.candidates[0].content.parts[0].text;
            
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                throw new Error('Invalid response format from AI');
            }
            
            return JSON.parse(jsonMatch[0]);
        }

        async function generateResponsesForClusters(clusters, apiKey) {
            for (const cluster of clusters) {
                const ticketTexts = cluster.tickets.map(t => t.text).join('\n- ');
                
                const prompt = `You are a professional customer support AI. Generate a comprehensive, helpful response template for this category of support tickets.

Category: ${cluster.category}
Priority: ${cluster.priority}

Related Tickets:
- ${ticketTexts}

Generate a professional response that:
1. Acknowledges the issue
2. Provides step-by-step solution
3. Offers additional help if needed
4. Is empathetic and professional

Keep the response concise (3-5 sentences) but complete. Return ONLY the response text, no additional formatting.`;

                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: prompt }]
                        }],
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 512
                        }
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to generate response');
                }

                const data = await response.json();
                cluster.aiResponse = data.candidates[0].content.parts[0].text.trim();
            }
        }

        function displayResults(clusters) {
            const totalTickets = tickets.length;
            const totalClusters = clusters.length;
            const avgTicketsPerCluster = (totalTickets / totalClusters).toFixed(1);

            document.getElementById('stats').innerHTML = `
                <div class="stat-card">
                    <div class="stat-value">${totalTickets}</div>
                    <div class="stat-label">Total Tickets</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${totalClusters}</div>
                    <div class="stat-label">Categories Found</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${avgTicketsPerCluster}</div>
                    <div class="stat-label">Avg per Category</div>
                </div>
            `;

            const priorityColors = {
                'High': 'var(--color-error)',
                'Medium': 'var(--color-warning)',
                'Low': 'var(--color-success)'
            };

            document.getElementById('clusterGrid').innerHTML = clusters.map((cluster, i) => `
                <div class="cluster-card">
                    <div class="cluster-header">
                        <h3 class="cluster-title">${cluster.category}</h3>
                        <span class="cluster-badge" style="background: ${priorityColors[cluster.priority] || 'var(--color-primary)'}">
                            ${cluster.priority} Priority
                        </span>
                    </div>
                    
                    <div class="cluster-tickets">
                        <strong style="display: block; margin-bottom: 8px; font-size: 13px;">Tickets in this category:</strong>
                        ${cluster.tickets.map(ticket => `
                            <div class="cluster-ticket">
                                <strong>Ticket #${ticket.id}:</strong> ${ticket.text}
                                <div style="margin-top: 4px; font-size: 11px; color: var(--color-text-secondary);">
                                    Intent: ${ticket.intent}
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <div class="cluster-response">
                        <div class="response-label">🤖 AI-Generated Response Template</div>
                        <div class="response-text">${cluster.aiResponse}</div>
                    </div>
                </div>
            `).join('');

            document.getElementById('analysisSection').style.display = 'block';
            document.getElementById('analysisSection').scrollIntoView({ behavior: 'smooth' });
        }

        function showError(message) {
            document.getElementById('error').innerHTML = `
                <div class="error">
                    <strong>Error:</strong> ${message}
                </div>
            `;
        }

        function updateAnalytics() {
            const data = getTimeRangeData(currentTimeRange);
            const aggregated = aggregateDataByTime(data, currentTimeRange);
            const trends = detectTrends(aggregated);
            const spikes = detectSpikes(aggregated);
            const prediction = predictNextPeriod(aggregated);
            const categoryTrends = getCategoryTrends(currentTimeRange);
            
            renderVolumeChart(aggregated);
            renderCategoryChart(categoryTrends);
            renderPriorityChart(data);
            renderInsights(trends, spikes, prediction, aggregated);
        }

        function renderVolumeChart(data) {
            const ctx = document.getElementById('volumeChart');
            
            if (volumeChart) {
                volumeChart.destroy();
            }
            
            volumeChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.map(d => new Date(d.time)),
                    datasets: [{
                        label: 'Ticket Volume',
                        data: data.map(d => d.count),
                        borderColor: 'rgba(33, 128, 141, 1)',
                        backgroundColor: 'rgba(33, 128, 141, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false
                        }
                    },
                    scales: {
                        x: {
                            type: 'time',
                            time: {
                                unit: currentTimeRange === '24h' ? 'hour' : 'day',
                                displayFormats: {
                                    hour: 'MMM d, HH:mm',
                                    day: 'MMM d'
                                }
                            },
                            grid: {
                                display: false
                            }
                        },
                        y: {
                            beginAtZero: true,
                            ticks: {
                                precision: 0
                            }
                        }
                    }
                }
            });
        }

        function renderCategoryChart(categoryData) {
            const ctx = document.getElementById('categoryChart');
            
            if (categoryChart) {
                categoryChart.destroy();
            }
            
            const colors = [
                'rgba(33, 128, 141, 0.8)',
                'rgba(50, 184, 198, 0.8)',
                'rgba(230, 129, 97, 0.8)',
                'rgba(168, 75, 47, 0.8)',
                'rgba(98, 108, 113, 0.8)'
            ];
            
            categoryChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: categoryData.map(c => c[0]),
                    datasets: [{
                        data: categoryData.map(c => c[1]),
                        backgroundColor: colors,
                        borderWidth: 2,
                        borderColor: 'var(--color-surface)'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right'
                        }
                    }
                }
            });
        }

        function renderPriorityChart(data) {
            const ctx = document.getElementById('priorityChart');
            
            if (priorityChart) {
                priorityChart.destroy();
            }
            
            const priorities = ['High', 'Medium', 'Low'];
            const counts = priorities.map(p => data.filter(t => t.priority === p).length);
            
            priorityChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: priorities,
                    datasets: [{
                        label: 'Tickets by Priority',
                        data: counts,
                        backgroundColor: [
                            'rgba(192, 21, 47, 0.8)',
                            'rgba(168, 75, 47, 0.8)',
                            'rgba(33, 128, 141, 0.8)'
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                precision: 0
                            }
                        }
                    }
                }
            });
        }

        function renderInsights(trends, spikes, prediction, data) {
            const container = document.getElementById('insightsGrid');
            
            const trendIcon = trends.trend === 'increasing' ? '📈' : trends.trend === 'decreasing' ? '📉' : '➡️';
            const trendColor = trends.trend === 'increasing' ? 'var(--color-error)' : 'var(--color-success)';
            
            const currentVolume = data[data.length - 1]?.count || 0;
            const avgVolume = (data.reduce((sum, d) => sum + d.count, 0) / data.length).toFixed(1);
            
            let insights = `
                <div class="insight-card">
                    <div class="insight-icon">${trendIcon}</div>
                    <div class="insight-title">Trend Analysis</div>
                    <div class="insight-value" style="color: ${trendColor}">
                        ${trends.change}%
                    </div>
                    <div class="insight-description">
                        Ticket volume is ${trends.trend} compared to the previous period
                    </div>
                </div>
                
                <div class="insight-card">
                    <div class="insight-icon">📊</div>
                    <div class="insight-title">Average Volume</div>
                    <div class="insight-value">${avgVolume}</div>
                    <div class="insight-description">
                        tickets per ${currentTimeRange === '24h' ? 'hour' : 'day'} in this period
                    </div>
                </div>
            `;
            
            if (prediction) {
                insights += `
                    <div class="insight-card">
                        <div class="insight-icon">🔮</div>
                        <div class="insight-title">Predicted Next Period</div>
                        <div class="insight-value">${prediction}</div>
                        <div class="insight-description">
                            Expected tickets based on recent trends
                        </div>
                    </div>
                `;
            }
            
            if (spikes.length > 0) {
                const latestSpike = spikes[spikes.length - 1];
                const spikeDate = new Date(latestSpike.time).toLocaleDateString();
                
                insights += `
                    <div class="insight-card">
                        <div class="insight-icon">⚠️</div>
                        <div class="insight-title">Spike Detected</div>
                        <div class="insight-value">${latestSpike.count}</div>
                        <div class="insight-description">
                            Unusual spike detected on ${spikeDate}
                            <div class="alert-badge">
                                🔔 ${spikes.length} spike(s) detected in this period
                            </div>
                        </div>
                    </div>
                `;
            }
            
            container.innerHTML = insights;
        }
        
document.addEventListener("DOMContentLoaded", function () {
  const input = document.getElementById("apiKey");
  const btn = document.getElementById("toggleKeyBtn");

  btn.addEventListener("click", function () {
    if (input.type === "password") {
      input.type = "text";
      btn.textContent = "Hide";
    } else {
      input.type = "password";
      btn.textContent = "Show";
    }
  });
});


        initializeHistoricalData();
        renderTicketList();
