'use strict';

document.getElementsByName("save_conf")[0].onclick = function() {
    let site = document.getElementsByName("site")[0].value;
    window.localStorage.setItem("host", site);
    console.info("Config saved");
};

function make_sensor(data, parent){
    let sensor = document.createElement('div');
    let grouping = data.entity_id.split('.');
    sensor.classList.add('sense', grouping[0]);
    sensor.setAttribute('data-state', data.state);
    sensor.setAttribute('data-name', grouping[1]);
    sensor.setAttribute('data-last_changed', data.last_changed);
    sensor.setAttribute('data-last_updated', data.last_updated);
    sensor.innerText = grouping[1];
    parent.appendChild(sensor);
}
