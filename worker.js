'use strict';

document.getElementsByName("save_conf")[0].onclick = function() {
    let site = document.getElementsByName("site")[0].value;
    window.localStorage.setItem("host", site);
    console.info("Config saved");
};

function sensor_type(data) {
    return data.entity_id.split('.');
}

function make_switch(data, grouping, parent) {
    let sp = document.createElement('span')
    let item = document.createElement('input');
    let label = document.createElement('label');
    let friendly_name;
    try{
        friendly_name = data.attributes.friendly_name;
    }
    catch {
        friendly_name = grouping[1];
    }
    label.setAttribute('for', grouping[1]);
    label.innerText = friendly_name;
    item.setAttribute('type', 'checkbox');
    item.classList.add(grouping[0]);
    for (let i in data) {
        if (typeof(data[i]) === "object") {
            for (let j in data[i]) {
                try {
                    let value = data[i][j];
                    if (value == null) {
                        value = "None"
                    } else {
                        value = value.toString();
                    }
                    item.setAttribute('data-' + i + '-' + j, value);
                }catch (e){
                    console.error(grouping, i, j, e);
                }
            }
            continue;
        }
        item.setAttribute('data-' + i, data[i].toString());
    }
    if (data.state === 'on') {
        item.setAttribute('checked', true);
    }
    sp.appendChild(item);
    sp.appendChild(label);
    parent.appendChild(sp);
    return sp;
}

function make_light(data, grouping, parent) {
    make_switch(data, grouping, parent);
}

function make_group(data, grouping, parent){
    make_switch(data, grouping, parent);
}

function make_sensor(data, grouping, parent){
    let item = document.createElement('div');
    item.classList.add(grouping[1]);
    try {
        for (let i in data) {
            if (typeof(data[i]) === "object") {
                for (let j in data[i]) {
                    try {
                        let value = data[i][j];
                        if (value == null) {
                            value = "None"
                        } else {
                            value = value.toString();
                        }
                        item.setAttribute('data-' + i + '-' + j, value);
                    }catch (e){
                        console.error(grouping, i, j, e);
                    }
                }
                continue;
            }
            item.setAttribute('data-' + i, data[i].toString());
        }
    } catch (e) {
        console.error(e, data);
        item.setAttribute('data-state', data.state);
        item.setAttribute('data-name', grouping[1]);
        item.setAttribute('data-last_changed', data.last_changed);
        item.setAttribute('data-last_updated', data.last_updated);
    }
    let friendly_name;
    try{
        friendly_name = data.attributes.friendly_name;
    }
    catch {
        friendly_name = grouping[1];
    }
    item.innerText = friendly_name;
    parent.appendChild(item);
}
