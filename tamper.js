// ==UserScript==
// @name         GoSweetSpot AutoFill
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  try to take over the world!
// @author       JH
// @match        https://*/EcommOrderImport/View?ecommerceOrderImportPK=*
// @match        https://phc.gosweetspot.com/ship*
// @updateURL  https://raw.githubusercontent.com/JonoHall/GSS/refs/heads/main/tamper.js
// @downloadURL  https://raw.githubusercontent.com/JonoHall/GSS/refs/heads/main/tamper.js
// @icon         https://gosweetspotcdn.blob.core.windows.net/images/favicon-phc.ico
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_addValueChangeListener
// ==/UserScript==

(function() {
    'use strict';
    function run() {
        function copyDetails() {
            var [notes,phone,email,contact,business,street1,street2] = "";
            var id = document.getElementsByClassName("ibox-content")[0].getElementsByTagName('h2')[0].innerText.split(" ")[3];
            var rawAddress = document.getElementsByClassName("font-large")[1].innerText;
            var addressDetails = rawAddress.split("\n");
            var notesDiv = document.getElementsByClassName("panel-body no-borders full-height-scroll")[0];

            var tempAddress = addressDetails.slice(2);
            var last = tempAddress.findIndex((x) => x == "");
            var address = tempAddress.slice(0,last);

            street1 = address[0];

            var city = address[address.length - 1].split(',')[0];
            var postcode = address[address.length - 1].split(',').pop().split(' ')[1];

            if(address.length == 3) {
                street2 = address[1];
            }

            if(typeof notesDiv !== "undefined") { notes = notesDiv.getElementsByClassName("multiline")[0].innerText; }

            phone = addressDetails.find(el => el.includes('Phone:')).replace('Phone: ','');

            email = addressDetails.find(el => el.includes('E-Mail:')).replace('E-Mail:','');

            contact = addressDetails.find(el => el.includes('Contact Name: '));
            if(contact) {
                contact = contact.replace('Contact Name: ','');
                business = addressDetails[0];
            } else {
                contact = addressDetails[0];
            }

            var totals = document.getElementsByClassName("dl-horizontal m-b-none");

            var freightCost = totals[2].childNodes[7].innerText;
            var orderObj = {id: id, rawAddress: rawAddress, street1: street1, street2: street2, city:city, postcode:postcode, phone: phone, email: email, contact: contact, business: business, notes: notes, freightCost: freightCost};
            GM_setValue("order", orderObj);
            return orderObj;
        }

        function ship() {
            var orderObj = copyDetails();
            window.location.href = 'https://phc.gosweetspot.com/ship?order='+orderObj.id;
        }

        function shipInv() {
            var orderObj = copyDetails();
            var orderPK = document.getElementsByClassName("ibox-content")[0].getElementsByTagName('h3')[0].getElementsByTagName('a')[0].getAttribute("href");
            const urlParams = new URLSearchParams(orderPK);
            orderPK = urlParams.get('/Order/View?orderPK');
            window.location.href = 'https://'+location.hostname+'/Order/SendInvoice?orderPK='+orderPK;
        }

        var ibox = document.getElementsByClassName("ibox-content")[0];

        var shipType = document.getElementsByClassName("dl-horizontal m-b-none")[1].getElementsByTagName('dd')[0].innerText;

        const shipInvButton = document.createElement('button');
        var shipInvButtonI = document.createElement('i');
        shipInvButtonI.classList.add("fas","fa-file");
        (shipType == "Pickup") ? shipInvButton.innerText = ' Ship Pickup Order + Invoice' : shipInvButton.innerText = ' Ship Order + Invoice';
        shipInvButton.prepend(shipInvButtonI);
        shipInvButton.addEventListener('click', () => {
            shipInv();
        });
        shipInvButton.classList.add("btn","m-l-xs","btn-sm");
        (shipType == "Pickup") ? shipInvButton.classList.add("btn-danger") : shipInvButton.classList.add("btn-primary")
        shipInvButton.style.float = "right";
        ibox.prepend(shipInvButton);

    }

    function GssRun() {
        var column = document.getElementsByClassName('col-md-5 col1')[0];
        var panelGroup = document.createElement("div");
        panelGroup.classList.add("panel-group");
        var panel = document.createElement("div");
        panel.classList.add("panel","panel-default");
        var panelHeading = document.createElement("div");
        panelHeading.classList.add("panel-heading");
        var heading = document.createElement("h4");
        heading.classList.add("panel-title");
        heading.textContent = "Import Order Original Address :";
        var panelBody = document.createElement("div");
        panelBody.classList.add("panel-body","ddl_show");
        panelBody.setAttribute("style", "white-space: pre-line;");
        panelBody.setAttribute("id", "RawImport");
        var panelCollapse = document.createElement("div");
        panelCollapse.classList.add("panel-collapse", "collapse", "in");

        panelHeading.prepend(heading);
        panel.prepend(panelHeading);
        panelGroup.prepend(panel);
        column.prepend(panelGroup);
        panelCollapse.prepend(panelBody);
        panel.append(panelCollapse);

        var order = GM_getValue("order");
        console.log(order.freightCost);
        var newline = "\r\n";
        document.getElementById('RawImport').textContent = order.street1 + newline;
        (order.street2) ? document.getElementById('RawImport').textContent += order.street2 + newline : null;
        document.getElementById('RawImport').textContent += order.city + ", " + order.postcode;

        document.getElementById('Destination_Name').value = order.contact;
        if(order.business) {
            document.getElementById('Destination_Building').value = order.business
        }
        var streetAddress = document.getElementById('Destination_StreetAddress');
        streetAddress.value = order.street1;
        document.getElementById('Destination_Phone').value = order.phone
        document.getElementById('Destination_Email').value = order.email
        document.getElementById('Destination_DeliveryInstructions').value = order.notes ? order.notes : null;
        document.getElementById('CustomerReference').value = order.id

        streetAddress.dispatchEvent(new Event('keyup', { 'bubbles': true }));

        let inputBox = document.getElementById('Destination_Postcode');

        (inputBox.value == order.postcode) ? inputBox.setAttribute("style", "border-color:#080") : inputBox.setAttribute("style", "border-color:#f00;");

        function observeElement(element, property, callback, delay = 0) {
            let elementPrototype = Object.getPrototypeOf(element);
            if (elementPrototype.hasOwnProperty(property)) {
                let descriptor = Object.getOwnPropertyDescriptor(elementPrototype, property);
                Object.defineProperty(element, property, {
                    get: function() {
                        return descriptor.get.apply(this, arguments);
                    },
                    set: function () {
                        let oldValue = this[property];
                        descriptor.set.apply(this, arguments);
                        let newValue = this[property];
                        if (typeof callback == "function") {
                            setTimeout(callback.bind(this, oldValue, newValue), delay);
                        }
                        return newValue;
                    }
                });
            }
        }

        observeElement(inputBox, "value", function (oldValue, newValue) {
            if(newValue == order.postcode){
                inputBox.setAttribute("style", "border-color:#080");
            } else {
                inputBox.setAttribute("style", "border-color:#f00;");
            }
        });

        return true;

    }

    if (/EcommOrderImport\/View/.test (location.pathname) ) {
        run();
    }
    else if (/phc\.gosweetspot\.com/.test (location.hostname) ) {
        GM_addValueChangeListener("order", function() {
            if(GM_getValue("order")) {
               window.location.href = 'https://phc.gosweetspot.com/ship?order='+GM_getValue("order").id;
            }
        });
        if(GM_getValue("order")){
            if(GssRun()) {
                GM_setValue("order", null);
            }
        }
    }
    else {
        // Run fall-back code, if any
    }

})();
