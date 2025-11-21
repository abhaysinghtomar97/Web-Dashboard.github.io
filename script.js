 // Simulated sensor data 
        let sensorData = {
            temperature: [],
            humidity: [],
            airQuality: [],
            timestamps: []
        };

        let alertsData = [];
        let historicalData = [];

        // Initialize charts
        let tempChart, humidityChart, aqChart;

        function initCharts() {
            const chartConfig = (label, color) => ({
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: label,
                        data: [],
                        borderColor: color,
                        backgroundColor: color + '20',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true
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
                            beginAtZero: false
                        }
                    }
                }
            });

            tempChart = new Chart(document.getElementById('tempChart'), chartConfig('Temperature', '#f44336'));
            humidityChart = new Chart(document.getElementById('humidityChart'), chartConfig('Humidity', '#2196f3'));
            aqChart = new Chart(document.getElementById('aqChart'), chartConfig('Air Quality', '#4caf50'));
        }

            // Simulate real-time data updates
        function generateSensorData() {
            const now = new Date();
            const timeStr = now.toLocaleTimeString();
            
            // Simulate sensor readings with some variation
            const temp = (25 + Math.random() * 10).toFixed(1);
            const humidity = (50 + Math.random() * 30).toFixed(1);
            const aq = Math.floor(100 + Math.random() * 150);
            const motion = Math.random() > 0.9;

            // Update current values
            document.getElementById('temperature').textContent = temp;
            document.getElementById('humidity').textContent = humidity;
            document.getElementById('airQuality').textContent = aq;
            document.getElementById('motionStatus').textContent = motion ? 'Motion Detected' : 'No Motion';
            document.getElementById('lastUpdate').textContent = now.toLocaleString();

            // Update camera timestamps
            document.getElementById('cam1Time').textContent = now.toLocaleString();
            document.getElementById('cam2Time').textContent = now.toLocaleString();

            // Update status badges
            updateStatus('tempStatus', temp, parseFloat(document.getElementById('tempThreshold').value));
            updateStatus('humidityStatus', humidity, parseFloat(document.getElementById('humidityThreshold').value));
            updateStatus('aqStatus', aq, parseFloat(document.getElementById('aqThreshold').value));

            // Store data for charts
            if (sensorData.timestamps.length > 20) {
                sensorData.timestamps.shift();
                sensorData.temperature.shift();
                sensorData.humidity.shift();
                sensorData.airQuality.shift();
            }

            sensorData.timestamps.push(timeStr);
            sensorData.temperature.push(temp);
            sensorData.humidity.push(humidity);
            sensorData.airQuality.push(aq);

            // Update charts
            updateCharts();

            // Add to historical data
            addHistoricalData(now, temp, humidity, aq, motion);

            // Check for alerts
            checkAlerts(temp, humidity, aq, motion);
        }

        function updateStatus(elementId, value, threshold) {
            const element = document.getElementById(elementId);
            element.className = 'metric-status';
            
            if (value < threshold * 0.8) {
                element.classList.add('status-good');
                element.textContent = 'Normal';
            } else if (value < threshold) {
                element.classList.add('status-warning');
                element.textContent = 'Warning';
            } else {
                element.classList.add('status-danger');
                element.textContent = 'Critical';
            }
        }

        function updateCharts() {
            tempChart.data.labels = sensorData.timestamps;
            tempChart.data.datasets[0].data = sensorData.temperature;
            tempChart.update('none');

            humidityChart.data.labels = sensorData.timestamps;
            humidityChart.data.datasets[0].data = sensorData.humidity;
            humidityChart.update('none');

            aqChart.data.labels = sensorData.timestamps;
            aqChart.data.datasets[0].data = sensorData.airQuality;
            aqChart.update('none');
        }

        function addHistoricalData(time, temp, humidity, aq, motion) {
            const data = {
                time: time.toLocaleString(),
                temp: temp,
                humidity: humidity,
                aq: aq,
                motion: motion,
                status: 'Normal'
            };

            if (historicalData.length >= 10) {
                historicalData.shift();
            }
            historicalData.push(data);

            updateHistoricalTable();
        }

        function updateHistoricalTable() {
            const tbody = document.getElementById('dataTableBody');
            tbody.innerHTML = '';

            historicalData.reverse().forEach(data => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${data.time}</td>
                    <td>${data.temp}</td>
                    <td>${data.humidity}</td>
                    <td>${data.aq}</td>
                    <td>${data.motion ? '✓ Detected' : '✗ None'}</td>
                    <td><span class="metric-status status-good">${data.status}</span></td>
                `;
            });
            historicalData.reverse();
        }

        function checkAlerts(temp, humidity, aq, motion) {
            const tempThreshold = parseFloat(document.getElementById('tempThreshold').value);
            const humidityThreshold = parseFloat(document.getElementById('humidityThreshold').value);
            const aqThreshold = parseFloat(document.getElementById('aqThreshold').value);

            if (temp > tempThreshold) {
                addAlert('Temperature Alert', `Temperature exceeded threshold: ${temp}°C`, 'danger');
            }
            if (humidity > humidityThreshold) {
                addAlert('Humidity Alert', `Humidity exceeded threshold: ${humidity}%`, 'warning');
            }
            if (aq > aqThreshold) {
                addAlert('Air Quality Alert', `Air quality exceeded threshold: ${aq} PPM`, 'danger');
            }
            if (motion) {
                addAlert('Motion Detected', 'Motion sensor triggered, image captured', 'warning');
            }
        }

        function addAlert(title, message, type) {
            const now = new Date();
            const alert = {
                title: title,
                message: message,
                type: type,
                time: now.toLocaleTimeString()
            };

            // Prevent duplicate alerts in short time
            const lastAlert = alertsData[alertsData.length - 1];
            if (lastAlert && lastAlert.title === title && 
                (now - new Date(lastAlert.fullTime)) < 10000) {
                return;
            }

            alert.fullTime = now;
            alertsData.push(alert);
            if (alertsData.length > 5) {
                alertsData.shift();
            }

            updateAlertsDisplay();
        }

        function updateAlertsDisplay() {
            const alertsList = document.getElementById('alertsList');
            alertsList.innerHTML = '';

            if (alertsData.length === 0) {
                alertsList.innerHTML = '<p style="color: #999;">No recent alerts</p>';
                return;
            }

            alertsData.reverse().forEach(alert => {
                const alertDiv = document.createElement('div');
                alertDiv.className = `alert-item ${alert.type}`;
                alertDiv.innerHTML = `
                    <div class="alert-content">
                        <div class="alert-title">${alert.title}</div>
                        <div class="alert-message">${alert.message}</div>
                    </div>
                    <div class="alert-time">${alert.time}</div>
                `;
                alertsList.appendChild(alertDiv);
            });
            alertsData.reverse();
        }

        function updateThresholds() {
            alert('✅ Threshold settings saved successfully!');
        }

        function exportData() {
            let csv = 'Timestamp,Temperature,Humidity,Air Quality,Motion,Status\n';
            historicalData.forEach(data => {
                csv += `${data.time},${data.temp},${data.humidity},${data.aq},${data.motion},${data.status}\n`;
            });

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `environmental_data_${new Date().toISOString()}.csv`;
            a.click();
        }

        function captureImage() {
            alert('📸 Image capture triggered! Check Telegram for the photo.');
        }

        // Initialize
        window.onload = function() {
            initCharts();
            generateSensorData();
            
            // Update every 3 seconds for demo
            setInterval(generateSensorData, 3000);
        };