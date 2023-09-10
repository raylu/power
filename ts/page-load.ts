import generateChart from './data-display';

const displayHeader = () => {
    const content = document.querySelector('#content');
    const header = document.createElement('div');
    header.setAttribute('id', 'header-container');
    const welcomeHeader = document.createElement('div');
    welcomeHeader.id = 'welcome-header';
    welcomeHeader.innerHTML = '<br>Power Data App<br>Welcome, here\'s your data!<br>';
    header.append(welcomeHeader);
    content.append(header);
};

const displayChart = () => {
    const content = document.querySelector('#content');
    const chart = document.createElement('div');
    chart.setAttribute('id', 'chart');
    content.append(chart);

    generateChart();
};

export {
    displayHeader,
    displayChart
};