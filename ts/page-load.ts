import generateChart from './data-display';

const displayHeader = () => {
    const content = document.querySelector('#content');
    content.innerHTML = '<header><h1>Power Data App</h1></header>';
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
    displayChart,
};
