import { Chart } from 'chart.js/auto';
import { BzipDataReader } from './datareader';

const file_input = document.getElementById("file_input");
file_input.onchange = _ => {
	load(file_input.files);
};

const drop_zone = document.getElementById("drop_zone");
drop_zone.ondragover = event => {
	event.stopPropagation();
	event.preventDefault();
	event.dataTransfer.dropEffect = 'copy';
};
drop_zone.ondrop = event => {
	event.stopPropagation();
	event.preventDefault();
	load(event.dataTransfer.files);
};
drop_zone.onclick = _ => file_input.click();

async function load(files) {
	if (files.length === 0) {
		return;
	}

	// Show temporary state info
	document.getElementById("main").replaceChildren(createElement("span", null, loading => loading.innerHTML = "Loading..."));

	// Load profiler data from file
	const profilerData = await files.item(0).arrayBuffer()
		.then(response => new Uint8Array(response))
		.then(buffer => new BzipDataReader(buffer))
		.then(dataReader => {
			function readProfilerResultEntry(dataReader, parent = null) {
				const name = dataReader.readUTF();
				const time = dataReader.readLong();
				const result = {
					name: name,
					time: time,
					self_time: time,
					parent: parent,
					children: []
				};

				const children = dataReader.readInt();
				for (let i = 0; i < children; i++) {
					result.children[i] = readProfilerResultEntry(dataReader, result);
					result.self_time -= result.children[i].time;
				}

				return result;
			}

			try {
				return Array.from({ length: dataReader.readInt() }, _ => readProfilerResultEntry(dataReader));
			} finally {
				dataReader.close();
			}
		});
	const mergedProfilerData = profilerData.map(entry => merge(entry));
	const aggregatedProfilerData = mergedProfilerData.reduce((mergedEntry, entry) => merge(entry, mergedEntry), null);

	// Create HTML elements using profiler data
	let chart;
	document.getElementById("main").replaceChildren(
		createElement("div", "merge-view", container => {
			container.appendChild(createElement("h1", null, head => {
				head.innerHTML = "Merge View";
			}));

			container.appendChild(createRootNode(aggregatedProfilerData, "merge-view", entry => {
				let path = [];
				let e = entry;
				while (e) {
					path.push(e.name);
					e = e.parent;
				}
				path = path.reverse();

				chart.data.datasets.at(0).data = mergedProfilerData.map((value, index) => {
					return path.slice(1).reduce((e, name) => e?.children[name], value)?.time ?? 0;
				});
				chart.update();
			}));

			return container;
		}),
		document.createElement("hr"),
		createElement("div", "graph", container => {
			container.appendChild(createElement("h1", null, head => {
				head.innerHTML = "Graph View";
			}));

			container.appendChild(createElement("canvas", null, canvas => {
				chart = new Chart(canvas, {
					type: "bar",
					data: {
						labels: mergedProfilerData.map((_, index) => index.toString()),
						datasets: [{
							barPercentage: 1.0,
							categoryPercentage: 1.0
						}]
					},
					options: {
						animation: false,
						onClick: (_, elements) => {
							if (elements.length > 0) {
								let oldElement = document.getElementById("frame-view");
								let newElement = createRootNode(profilerData[elements[0].index], "frame-view");
								oldElement.parentNode.replaceChild(newElement, oldElement);
							}
						}
					}
				});
			}));

			return container;
		}),
		document.createElement("hr"),
		createElement("div", "frame-view", container => {
			container.appendChild(createElement("h1", null, head => {
				head.innerHTML = "Frame View";
			}));

			container.appendChild(createElement("span", null, tooltip => {
				tooltip.id = "frame-view";
				tooltip.innerHTML = "Click in graph view";
			}));

			return container;
		})
	);
}

function merge(entry, mergedEntry = null, parent = null) {
	if (!mergedEntry) {
		mergedEntry = {
			name: entry.name,
			time: entry.time,
			self_time: entry.self_time,
			parent: parent,
			children: {}
		};
	} else {
		mergedEntry.time += entry.time;
		mergedEntry.self_time += entry.self_time;
	}
	Object.values(entry.children).forEach(child => {
		mergedEntry.children[child.name] = merge(child, mergedEntry.children[child.name], mergedEntry);
	});
	return mergedEntry;
}

function createRootNode(entry, id, onclickSection = null) {
	const result = createNode(entry, entry, null, onclickSection);
	result.id = id;
	return result;
}

function createNode(entry, root, parent = null, onclickSection = null) {
	return createElement("li", "collapsed", node => {
		if (!parent) {
			node.classList.add("root");
		}

		node.appendChild(createElement("div", "section", section => {
			section.appendChild(createElement("div", "info", info => {
				info.appendChild(createElement("span", "name", name => {
					name.innerHTML = entry.name;
				}));
				info.appendChild(createElement("span", "percent", percent => {
					const r = 255;
					const g = 204 + (34 - 204) * (parent ? entry.time / parent.time : 1);
					const b = 34;
					percent.style = "color: rgb(" + r + ", " + g + ", " + b + ");";
					percent.innerHTML = (entry.time / root.time).toLocaleString("en", { style: 'percent', minimumFractionDigits: 2 });
				}));
				info.appendChild(createElement("span", "time", time => {
					time.innerHTML = (entry.time / 1000000).toFixed(2) + "ms";
				}));
				info.appendChild(createElement("span", "time", time => {
					time.innerHTML = "(self " + (entry.self_time / 1000000).toFixed(2) + "ms)";
				}));
			}));

			section.appendChild(createElement("div", "bar", bar => {
				bar.appendChild(createElement("div", "percent", percent => {
					percent.style.width = (100 * entry.time / root.time) + "px";
				}));
			}));

			section.onclick = () => {
				if (node.classList.contains("collapsed")) {
					node.classList.replace("collapsed", "uncollapsed");
				} else {
					node.classList.replace("uncollapsed", "collapsed");
				}

				if (onclickSection) {
					onclickSection(entry);
				}
			};
		}));

		if (entry.children && Object.keys(entry.children).length > 0) {
			node.appendChild(createElement("ul", "children", children => {
				Object.values(entry.children)
					.sort((e1, e2) => {
						return e1.time >= e2.time ? -1 : 1;
					})
					.forEach(child => {
						children.appendChild(createNode(child, root, entry, onclickSection));
					});
			}));
		}
	});
}

function createElement(name, className = null, callback = null) {
	const element = document.createElement(name);
	if (className) {
		element.classList.add(className);
	}
	if (callback) {
		callback(element);
	}
	return element;
}
