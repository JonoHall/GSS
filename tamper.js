// ==UserScript==
// @name         GoSweetSpot AutoFill
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  try to take over the world!
// @author       JH
// @match        https://*/EcommOrderImport/View?ecommerceOrderImportPK=*
// @match        https://*/Order/View*
// @match        https://phc.gosweetspot.com/ship*
// @match        https://*/EcommOrderImport/ImportOrders
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
            function splitAddress(addressRaw) {
                var addressObj = {};
                addressObj.addContact = addressRaw[0];
                addressObj.street1 = addressRaw[2];
                addressObj.street2 = (addressRaw.length == 5) ? addressRaw[3] : "";
                addressObj.city = addressRaw[addressRaw.length - 1].split(',')[0];
                var lastLine = addressRaw[addressRaw.length - 1].split(',').pop().split(' ');
                addressObj.postCode = lastLine[lastLine.length - 2];
                return addressObj;
            }
            var orderObj = {};

            const orderViewJsData = document.getElementById("orderViewJsData");

            var relatedLazyLoadURL = new URLSearchParams(orderViewJsData.dataset.relatedlazyloadurl.toString().split('?')[1]);
            orderObj.orderNo = relatedLazyLoadURL.get("orderNo");
            orderObj.orderPK = relatedLazyLoadURL.get("orderPK");
            var addressObj = splitAddress(document.getElementsByClassName("col-lg-6 p-w-lg")[1].innerText.split("\n").slice(1));
            orderObj.addressObj = addressObj;
            var notes = document.getElementsByClassName("panel-body no-borders full-height-scroll")[0].getElementsByTagName('p')[0].innerText;
            orderObj.notes = (notes == "None") ? "" : notes;
            var contactDetails = document.getElementsByClassName("col-lg-4")[8].getElementsByClassName("dl-horizontal")[0].getElementsByTagName('dd');

            orderObj.contactName = (contactDetails[0].innerText.trim() != "None") ? contactDetails[0].innerText.trim() : addressObj.addContact;
            orderObj.businessName = (contactDetails[0].innerText.trim() != "None") ? addressObj.addContact : "";

            orderObj.phone = contactDetails[2].innerText.trim();
            orderObj.email = contactDetails[4].getElementsByTagName('button')[0].dataset.emailto;

            return orderObj;
        }

        if(document.getElementsByClassName("col-lg-4")[8]){
            var InvoicedOn = null;
            var shipType = (document.getElementsByClassName("col-lg-4")[9].getElementsByTagName('dt')[0].innerText == "Ship Type:") ? document.getElementsByClassName("col-lg-4")[9].getElementsByTagName('dd')[0].innerText : null;
            var shippedOn = (document.getElementsByClassName("col-lg-4")[5].getElementsByTagName('dt')[5].innerText == "Shipped On:") ? document.getElementsByClassName("col-lg-4")[5].getElementsByTagName('dd')[5].innerText : null;
            var activeStatus = document.getElementById("OrderProgressBar").getElementsByClassName("active")[0].innerText;
            if(document.getElementsByClassName("col-lg-4")[5].getElementsByTagName('dt')[6]){
                InvoicedOn = (document.getElementsByClassName("col-lg-4")[5].getElementsByTagName('dt')[6].innerText == "Invoiced On:") ? document.getElementsByClassName("col-lg-4")[5].getElementsByTagName('dd')[6].innerText : null;
            }
            const shipInvButton = document.createElement('button');

            var shipInvButtonI = document.createElement('i');
            shipInvButtonI.classList.add("fas","fa-truck");

            (shipType == "Pickup") ? shipInvButton.innerText = ' Ship Pickup Order' : shipInvButton.innerText = ' GoSweetSpot';

            shipInvButton.prepend(shipInvButtonI);
            shipInvButton.addEventListener('click', () => {
                var orderObj = copyDetails();
                GM_setValue("order", orderObj);
                if(activeStatus == "Shipped"){
                    window.location.href = 'https://'+location.hostname+'/Order/SendInvoice?orderPK='+orderObj.orderPK;
                }
            });

            shipInvButton.classList.add("btn","btn-sm");
            if(shipType == "Pickup"){
                shipInvButton.classList.add("btn-danger")
            } else {
                (activeStatus == "Shipped") ? shipInvButton.classList.add("btn-primary") : shipInvButton.classList.add("btn-secondary");
            }
            var buttons = document.getElementsByClassName("ibox-content")[0].getElementsByClassName("pull-right m-l-xs")[0];
            buttons.prepend(shipInvButton);
        }
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
        var address = order.addressObj;
        var newline = "\r\n";
        document.getElementById('RawImport').textContent = address.street1 + newline;
        (address.street2) ? document.getElementById('RawImport').textContent += address.street2 + newline : null;
        document.getElementById('RawImport').textContent += address.city + ", " + address.postCode;

        document.getElementById('Destination_Name').value = order.contactName;
        if(order.businessName) {
            document.getElementById('Destination_Building').value = order.businessName
        }
        var streetAddress = document.getElementById('Destination_StreetAddress');
        streetAddress.value = order.addressObj.street1;
        document.getElementById('Destination_Phone').value = order.phone
        document.getElementById('Destination_Email').value = order.email
        document.getElementById('Destination_DeliveryInstructions').value = order.notes ? order.notes : null;
        document.getElementById('CustomerReference').value = order.orderNo

        streetAddress.dispatchEvent(new Event('keyup', { 'bubbles': true }));

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

        var mapReplaceObj = {
            HAMILTON: "WAIKATO", ROAD: "RD", AVENUE: "AVE", CRESCENT: "CRES", DRIVE: "DR", HIGHWAY: "HWY", LANE: "LN", PLACE: "PL", STREET: "ST", TERRACE: "TCE"
        };

        function objToString (obj) {
            let str = '';
            for (const [p, val] of Object.entries(obj)) {
                str += `${p}|`;
            }
            return str;
        }

        var replaceStrg = objToString(mapReplaceObj);
        var replaceRegEx = new RegExp(replaceStrg.substring(0, replaceStrg.length - 1), "gi");

        var compareAddressOriginal = address.street1.toUpperCase();
        compareAddressOriginal = compareAddressOriginal.replace(replaceRegEx, function(matched){
            return mapReplaceObj[matched];
        }).replace("'","");

        observeElement(streetAddress, "value", function (oldValue, newValue) {
            let inputBox = document.getElementById('Destination_Postcode');
            let suburb = document.getElementById('Destination_Suburb');
            (inputBox.value == address.postCode) ? inputBox.setAttribute("style", "border-color:#080") : inputBox.setAttribute("style", "border-color:#f00;");

            var compareAddressNew = newValue.replace(replaceRegEx, function(matched){
                return mapReplaceObj[matched];
            }).toUpperCase().replace("'","");
            if(compareAddressOriginal.match(suburb.value) || address.street2 == suburb.value){
                suburb.setAttribute("style", "border-color:#080");
                compareAddressOriginal = compareAddressOriginal;
            } else {
                suburb.removeAttribute("style", "border-color:#080");
            }

            if(compareAddressOriginal.replace(document.getElementById('Destination_Suburb').value,"").replace(",","").trim() == compareAddressNew){
                streetAddress.setAttribute("style", "border-color:#080");
            } else {
                streetAddress.setAttribute("style", "border-color:#f00");
            }

            if(order.street2){
                if(suburb.value.toUpperCase() == order.street2.toUpperCase()){
                    suburb.setAttribute("style", "border-color:#080");
                } else {
                    suburb.setAttribute("style", "border-color:#f00");
                }
            }

            var compareCity = address.city.toUpperCase();
            compareCity = compareCity.replace(replaceRegEx, function(matched){
                return mapReplaceObj[matched];
            });

            var city = document.getElementById('Destination_City');

            if(city.value.toUpperCase() == compareCity){
                city.setAttribute("style", "border-color:#080");
            } else {
                city.setAttribute("style", "border-color:#f00");
            }
        });

        return true;

    }

    function ecommImport() {
        var iBoxes = document.getElementsByClassName('ibox');
        if(iBoxes.length > 1){
            Array.from(iBoxes).slice(1).forEach((iBox) => {
                var leftCol = iBox.getElementsByClassName('col-lg-6 border-right')[0];
                var rightCol = iBox.getElementsByClassName("col-lg-6")[3];
                var shipType = leftCol.getElementsByClassName('pull-left')[0];
                if(shipType.innerText.includes('Pickup')){
                    shipType.classList.add("text-danger");
                }
                var importEmail = iBox.getElementsByClassName("row m-t")[0].getElementsByClassName("col-lg-6")[0].innerText.split(/\r\n|\n/).filter(element => element.includes("E-Mail"))[0].split("E-Mail: ")[1];
                var matchRows = rightCol.getElementsByClassName("row");
                Array.from(matchRows).forEach((row) => {
                    var matchData = row.getElementsByTagName('div')[0]
                    var matchEmail = matchData.innerText.split(/\r\n|\n/).filter(element => element.includes("E-Mail"))[0].split("E-Mail: ")[1];
                    if(importEmail == matchEmail){
                        matchData.classList.add("text-success");
                    }
                });
            });
        }
    }

    if (/Order\/View/.test (location.pathname) ) {
        run();
    }
    else if (/phc\.gosweetspot\.com/.test (location.hostname) ) {
        GM_addValueChangeListener("order", function() {
            if(GM_getValue("order")) {
               window.location.href = 'https://phc.gosweetspot.com/ship';
            }
        });
        if(GM_getValue("order")){
            if(GssRun()) {
                GM_setValue("order", null);
            }
        }
    }
    else if (/EcommOrderImport\/ImportOrders/.test (location.pathname) ) {
        ecommImport();
    }
    else {
    }

})();
