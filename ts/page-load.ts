import generateChart from './data-display';

const today = new Date();
const formattedEndDate = today.toLocaleDateString('sv');
const startDate = new Date(new Date().setDate(new Date().getDate()-30));
const formattedStartDate = startDate.toLocaleDateString('sv');

const handleDateFilterSubmit = (event) => {
    const formID = event.target.id;

    const startDateValue = (<HTMLInputElement>document.getElementById(`${formID}-start`)).value;
    const endDateValue = (<HTMLInputElement>document.getElementById(`${formID}-end`)).value;

    generateChart(startDateValue, endDateValue);
};

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
    chart.className = 'chart';

    chartContainer.append(chartHeader, displayFilter('power-chart', 'date'), chart);
    content.append(chartContainer);
    generateChart(formattedStartDate, formattedEndDate);
};

const displayFilter = (elementID: string, filterType: string) => {
    const chartFilter = document.createElement('form');
    chartFilter.setAttribute('id', `${elementID}-form`);
    chartFilter.className = 'filter-form';
    if (filterType == 'date') {
        
        chartFilter.innerHTML = `
            <label for="start">Start date: </label>
            <input type="date" id="${elementID}-form-start" name="${elementID}-start" value="${formattedStartDate}"/>
            <label for="end">End date: </label>
            <input type="date" id="${elementID}-form-end" name="${elementID}-end" value="${formattedEndDate}"/>
            <input type="submit" id="${elementID}-form-submit" value="Update Chart"/>
            `;
    }

    chartFilter.addEventListener('submit', (event) => {
        event.preventDefault();
        if (filterType == 'date') {
            handleDateFilterSubmit(event);
        }
    });
    return chartFilter;
};

export {
    displayHeader,
    displayChart,
};
