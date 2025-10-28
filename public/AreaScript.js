// const localIp = "https://esys.slpa.lk/m/slpa_whether/";
const localIp = "192.168.8.110";
const port = 3000;

// DOM Elements
const rainStatusEl = document.getElementById('rain-status');
const rainTextEl = document.getElementById('rain-text');
const rainfallEl = document.getElementById('rainfall');
const rainPredictionEl = document.getElementById('rain-prediction');
const predictionBarEl = document.getElementById('prediction-bar');
const temperatureEl = document.getElementById('temperature');
const humidityEl = document.getElementById('humidity');
const pressureEl = document.getElementById('pressure');
const ultrasonicEl = document.getElementById('ultrasonic');
const alertMessage = document.getElementById('alert-message');

// Chart data
let timeLabels = [];
let rainfallData = [];
let tempData = [];
let humidityData = [];
let pressureData = [];

// Chart options helper
function createChartOptions(yTitle, xTitle='Time') {
    return {
        responsive: true,
        scales: {
            x: { ticks:{color:'white', font:{size:12, weight:'bold'}}, title:{display:true, text:xTitle, color:'#ffcc00', font:{size:14, weight:'bold'}} },
            y: { ticks:{color:'white', font:{size:12, weight:'bold'}}, title:{display:true, text:yTitle, color:'#ffcc00', font:{size:14, weight:'bold'}} }
        }
    };
}

// Create charts
const rainfallChart = new Chart(document.getElementById('rainfallChart'), { type:'line', data:{ labels: timeLabels, datasets:[{ label:'Rainfall (mm)', data: rainfallData, borderColor:'#00b894', backgroundColor:'rgba(0,184,148,0.2)', fill:true, tension:0.3 }]}, options:createChartOptions('Rainfall (mm)') });

const envChart = new Chart(document.getElementById('envChart'), { 
    type:'line', 
    data:{ labels: timeLabels, datasets:[
        {label:'Temperature (°C)', data: tempData, borderColor:'#ff7675', backgroundColor:'rgba(255,118,117,0.2)', fill:true, tension:0.3},
        {label:'Humidity (%)', data: humidityData, borderColor:'#0984e3', backgroundColor:'rgba(9,132,227,0.2)', fill:true, tension:0.3},
        {label:'Pressure (hPa)', data: pressureData, borderColor:'#fdcb6e', backgroundColor:'rgba(253,203,110,0.2)', fill:true, tension:0.3}
    ]}, options:createChartOptions('Value') 
});

const tempChart = new Chart(document.getElementById('tempChart'), { type: 'line', data:{ labels: timeLabels, datasets:[{ label:'Temperature (°C)', data: tempData, borderColor:'red', backgroundColor:'rgba(255,0,0,0.2)', fill:true, tension:0.3, pointRadius:5, pointHoverRadius:7 }]}, options:createChartOptions('Temperature (°C)') });

const humChart = new Chart(document.getElementById('humChart'), { type:'line', data:{ labels: timeLabels, datasets:[{ label:'Humidity (%)', data: humidityData, borderColor:'blue', backgroundColor:'rgba(0,0,255,0.2)', fill:true, tension:0.3 }]}, options:createChartOptions('Humidity (%)') });

const pressureChart = new Chart(document.getElementById('pressureChart'), { type:'line', data:{ labels: timeLabels, datasets:[{ label:'Pressure (hPa)', data: pressureData, borderColor:'#fdcb6e', backgroundColor:'rgba(253,203,110,0.2)', fill:true, tension:0.3, pointRadius:5, pointHoverRadius:7 }]}, options:createChartOptions('Pressure (hPa)') });

const rainPredChart = new Chart(document.getElementById('rainPredChart'), { type:'bar', data:{ labels: timeLabels, datasets:[{ label:'Rain Prediction (%)', data: [], backgroundColor:'rgba(0,184,148,0.7)', borderColor:'#00b894', borderWidth:1 }]}, options:createChartOptions('Prediction (%)') });

// Fetch live data from backend
async function updateDashboard(){
    try {
        // console.log(localIp);
        // console.log(port);
        
        const response = await fetch(`http://${localIp}:${port}/api/sensor-data`);
        const data = await response.json();

        const isRaining = data.rain_status === 1;
        const rainfall = parseFloat(data.rainfall).toFixed(2);
        const prediction = parseFloat(data.prediction).toFixed(2);
        const temp = parseFloat(data.temperature).toFixed(2);
        const humidity = parseFloat(data.humidity).toFixed(2);
        const pressure = parseFloat(data.pressure).toFixed(2);
        const ultrasonic = data.level ? parseFloat(data.level).toFixed(2) : "0.00";

        const now = new Date();
        const timeLabel = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');

        // Update UI
        rainStatusEl.textContent = isRaining ? '🟢 Raining' : '🔴 Not Raining';
        rainTextEl.textContent = isRaining ? 'It is currently raining' : 'No rain detected';
        rainfallEl.textContent = rainfall + ' mm';
        rainPredictionEl.textContent = prediction + '%';
        temperatureEl.textContent = "Temperature: " + temp + " °C";
        humidityEl.textContent = "Humidity: " + humidity + " %";
        pressureEl.textContent = "Pressure: " + pressure + " hPa";
        ultrasonicEl.textContent = "Rainfall Level: " + ultrasonic + " cm";
        predictionBarEl.style.width = prediction + '%';
        predictionBarEl.style.backgroundColor = prediction < 40 ? '#00b894' : (prediction < 70 ? '#f4a261' : '#e63946');

        // Update chart data
        if(timeLabels.length >= 20){
            timeLabels.shift();
            rainfallData.shift();
            tempData.shift();
            humidityData.shift();
            pressureData.shift();
            rainPredChart.data.datasets[0].data.shift();
        }
        timeLabels.push(timeLabel);
        rainfallData.push(rainfall);
        tempData.push(temp);
        humidityData.push(humidity);
        pressureData.push(pressure);
        rainPredChart.data.datasets[0].data.push(prediction);

        rainfallChart.update();
        envChart.update();
        tempChart.update();
        humChart.update();
        pressureChart.update();
        rainPredChart.update();

        // Alerts
        let alertMsg = "";
        if(rainfall > 3) alertMsg += '⚠️ Cover moisture-sensitive cargo immediately! ';
        if(prediction > 70) alertMsg += '⚠️ Rain likely soon, prepare operations.';
        alertMessage.textContent = alertMsg || "No alerts";

    } catch (err) {
        console.error("Error fetching data:", err);
        alertMessage.textContent = "⚠️ Error fetching live sensor data.";
    }
}

setInterval(updateDashboard, 5000);
updateDashboard();