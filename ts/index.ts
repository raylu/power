import generateChart from './data-display';

const today = new Date();
const formattedEndDate = today.toLocaleDateString('sv');
const startDate = new Date(new Date().setDate(new Date().getDate()-30));
const formattedStartDate = startDate.toLocaleDateString('sv');

const handleDateFilterSubmit = (formID: string) => {
	const startDateValue = (<HTMLInputElement>document.getElementById(`${formID}-start`)).value;
	const endDateValue = (<HTMLInputElement>document.getElementById(`${formID}-end`)).value;

	generateChart(startDateValue, endDateValue);
};

const chartFilter = document.querySelector('#power-chart-form');
(chartFilter.querySelector('input[name="power-chart-start"]') as HTMLInputElement).value = formattedStartDate;
(chartFilter.querySelector('input[name="power-chart-end"]') as HTMLInputElement).value = formattedEndDate;
chartFilter.addEventListener('submit', (event) => {
	event.preventDefault();
	handleDateFilterSubmit(chartFilter.id);
});
generateChart(formattedStartDate, formattedEndDate);
