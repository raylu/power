import generateChart from './data-display';

const displayHeader = () => {
    const content = document.querySelector('#content');
    content.innerHTML = '<header><h1>Power Data App</h1></header>';
};

const displayChart = () => {
    const content = document.querySelector('#content');
    const chartContainer = document.createElement('div');
    chartContainer.className = 'chart-container';
    const chartHeader = document.createElement('div');
    chartHeader.setAttribute('id', 'power-chart-header');
    chartHeader.innerHTML = '<h3>Power Usage (kWh) and Cost Over Time</h3>';
    const chart = document.createElement('div');
    chart.setAttribute('id', 'power-chart');

    chartContainer.append(chartHeader, displayFilter('power-chart', 'date'), chart);
    content.append(chartContainer);
    generateChart();
};

const displayFilter = (elementID: string, filterType: string) => {
    const chartFilter = document.createElement('div');
    chartFilter.setAttribute('id', `${elementID}-filter`);
    chartFilter.className = 'chart-filter';
    if (filterType == 'date') {
        const today = new Date();
        const formattedEndDate = today.toLocaleDateString('sv');
        const startDate = new Date(new Date().setDate(new Date().getDate()-30));
        const formattedStartDate = startDate.toLocaleDateString('sv');
        chartFilter.innerHTML = `
        <form id="${elementID}-form" class="filter-form">
            <label for="start">Start date: </label>
            <input type="date" id="${elementID}-start" name="${elementID}-start" value="${formattedStartDate}"/>
            <label for="end">End date: </label>
            <input type="date" id="${elementID}-end" name="${elementID}-end" value="${formattedEndDate}"/>
            <input type="submit" value="Update Chart"/>
        </form>`;
    }
    return chartFilter;
};

export {
    displayHeader,
    displayChart,
};
