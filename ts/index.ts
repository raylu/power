import generateChart from './data-display';

interface HashParams {
	start: string,
	end: string,
}

let formattedStartDate: string, formattedEndDate: string;

if (location.hash.length > 2) {
	let hash = location.hash;
	if (hash.substring(0,1) == '#')
		hash = hash.substring(1);

	const hashParams = {};
	for (const param of hash.split('&')) {
		const [key, value] = param.split('=', 2);
		hashParams[key] = value;
	}
	({'start': formattedStartDate, 'end': formattedEndDate} = hashParams as HashParams);
} else {
	const today = new Date();
	formattedEndDate = today.toLocaleDateString('sv');
	const startDate = new Date();
	startDate.setDate(new Date().getDate() - 30);
	formattedStartDate = startDate.toLocaleDateString('sv');
}

const handleDateFilterSubmit = (formID: string) => {
	const startDate = (document.getElementById(`${formID}-start`) as HTMLInputElement).value;
	const endDate = (document.getElementById(`${formID}-end`) as HTMLInputElement).value;
	if (startDate && endDate) {
		generateChart(startDate, endDate);
		history.pushState({}, '', location.pathname + `#start=${startDate}&end=${endDate}`);
	}
};

const chartFilter = document.querySelector('#power-chart-form');
(chartFilter.querySelector('input[name="power-chart-start"]') as HTMLInputElement).value = formattedStartDate;
(chartFilter.querySelector('input[name="power-chart-end"]') as HTMLInputElement).value = formattedEndDate;
chartFilter.addEventListener('submit', (event) => {
	event.preventDefault();
	handleDateFilterSubmit(chartFilter.id);
});
generateChart(formattedStartDate, formattedEndDate);
