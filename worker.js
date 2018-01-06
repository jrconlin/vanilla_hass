'use strict';

function sensor_type(entity_id) {
    // Split the sensor type information into the group and entity_id.
    return entity_id.split('.');
}

function toggle_switch(event) {
    // Toggle a switch between "On" and "Off"
    // Uses the generic "homeassistant" service rather than "light" or "switch".
    console.debug("Switch toggled", event);
    let target = event.target;
    let state = target.checked;
    let action = {      // Toggle the current state.
        true: "turn_on",
        false: "turn_off"
    };
    window.ws.send(
        {
            "type": "call_service",
            "domain": "homeassistant",
            "service": action[state],
            "service_data": {
                "entity_id": target.dataset.entity_id
            },
        },
        function (response) {
            console.debug('response', response);
            if (response.success) {
                target.checked = state;
            }
        });
    // Returning "false" prevents the normal rendering action. We do that later as part of the visual
    // verification that the command worked.
    return false;
}

function make_switch(data, grouping, parent) {
    // Make a generic, "switch" that can be toggled between "on" and "off".
    let previous = parent.getElementsByClassName(grouping[1]);
    if (previous.length){
        return update_item(previous[0], data, grouping);
    }
    let sp = document.createElement('span')
    let item = document.createElement('input');
    let label = document.createElement('label');

    // Use a friendly name, if defined.
    let friendly_name;
    try{
        friendly_name = data.attributes.friendly_name;
    }
    catch (e) {
        friendly_name = grouping[1];
    }
    label.setAttribute('for', grouping[1]);
    label.innerText = friendly_name;
    item.id = grouping[1];
    item.setAttribute('type', 'checkbox');
    item.classList.add(grouping[1]);

    // Define the dataset as a flat array of the various attributes. We'll use these later as part of the controls.
    update_item(item, data, grouping);
    if (data.attributes["hidden"]) {
        sp.classList.add("hidden");
    }
    if (data.state === 'on') {
        item.setAttribute('checked', true);
    }
    // "Change" is invoked AFTER a state change for a switch.
    item.addEventListener('change', toggle_switch);
    // build the label and input element
    sp.appendChild(item);
    sp.appendChild(label);
    // add it to the parent group.
    parent.appendChild(sp);
    return sp;
}

function make_light(data, grouping, parent) {
    make_switch(data, grouping, parent);
}

function make_group(data, grouping, parent){
    make_switch(data, grouping, parent);
}

function make_sun(data, grouping, parent){
    // Since I can't do this with CSS alone,
    let sun = make_sensor(data, grouping, parent);
    if (data.state === "above_horizon") {
        if (data.attributes["azimuth"] <= 180) {
            sun.innerText = "Good Morning";
        } else {
            sun.innerText = "Good Afternoon";
        }
    } else {
        sun.innerText = "Good Evening";
    }
}

function make_camera(data, grouping, parent) {
    let previous = parent.getElementsByClassName(grouping[1]);
    let item;
    if (previous.length) {
        item = previous[0];
    } else {
        item = document.createElement('img');
        let host = new URL(window.ws.socket.url).host;
        item.src = '//' + host + data.attributes.entity_picture;
        item.classList.add(grouping[1]);
    }
    let raw_src = item.src;
    function update_img() {
        item.src = raw_src + "&time=" + Date.now();
    }
    setInterval(update_img, 5000);
    parent.appendChild(item);
}

function update_item(item, data, grouping) {
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
    return item;
}

function make_sensor(data, grouping, parent){
    // A "sensor" is a generic "Read only" sort of data input.
    let previous = parent.getElementsByClassName(grouping[1]);
    if (previous.length){
        return update_item(previous[0], data, grouping);
    }
    let item = document.createElement('div');
    item.classList.add(grouping[1]);
    // Define the dataset for this element. We'll use these later when we want to do something with the control.
    try {
        update_item(item, data, grouping);
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
    catch (e) {
        friendly_name = grouping[1];
    }
    item.innerText = friendly_name;
    parent.appendChild(item);
    return item;
}

function find_element(entity_id){
    let path = sensor_type(entity_id);
    try {
        let sect = document.getElementsByClassName('section ' + path[0])[0];
        return sect.getElementsByClassName(path[1])[0];
    } catch (e) {
        console.error("Unknown entity", entity_id);
        return undefined;
    }
}

function handle_event(event) {
    switch(event.event_type){
        case "state_changed":
            let entity = event.data.entity_id;
            let item = find_element(entity);
            if (item) {
                // Update the current state.
                item.dataset.state = event.data.new_state.state;
                // Toggle the checkbox if need be.
                if ("checked" in item) {
                    switch (item.dataset.state) {
                        case "on":
                            item.checked = true;
                            break;
                        case "false":
                            item.checked = false;
                            break;
                        default:
                    }
                }
                console.debug(entity, "updated to", item.dataset.state);
            } else {
                console.warn("Unknown entity", entity);
            }
            break;
        default:
            console.warn("Unknown state ", event.event_type);
    }
}
