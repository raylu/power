import render from './data-display';

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

const chartFilter = document.querySelector('#power-chart-form');
const startFilter = chartFilter.querySelector('input[name="power-chart-start"]') as HTMLInputElement;
const endFilter = chartFilter.querySelector('input[name="power-chart-end"]') as HTMLInputElement;

function handleDateFilterSubmit() {
	const startDate = startFilter.value;
	const endDate = endFilter.value;
	if (startDate && endDate) {
		render(startDate, endDate);
		history.pushState({}, '', location.pathname + `#start=${startDate}&end=${endDate}`);
	}
}

startFilter.value = formattedStartDate;
endFilter.value = formattedEndDate;
chartFilter.addEventListener('submit', (event) => {
	event.preventDefault();
	handleDateFilterSubmit();
});
render(formattedStartDate, formattedEndDate);
