var check = {
  // (A) PROPERTIES
  hForm : null, // html check form
  hSKU : null, hBatch : null, // html sku & batch fields
  hnBtn : null, hnStat : null, // html nfc button & status
  sku : null, batch: null, // current item & batch
  pg : 1, // current page

  // (B) INIT
  init : () => {
    // (B1) GET HTML ELEMENTS
    check.hForm = document.getElementById("check-form");
    check.hSKU = document.getElementById("check-sku");
    check.hBatch = document.getElementById("check-batch");
    check.hnBtn = document.getElementById("nfc-btn");
    check.hnStat = document.getElementById("nfc-stat");

    // (B2) INIT NFC
    if ("NDEFReader" in window) {
      // (B2-1) ON SUCCESSFUL NFC READ
      nfc.onread = evt => {
        try {
          nfc.standby();
          const decoder = new TextDecoder();
          let code = JSON.parse(decoder.decode(evt.message.records[0].data));
          check.hSKU.value = code.S;
          check.hBatch.value = code.B;
          check.pre();
        } catch (e) {
          console.error(e);
          cb.modal("ERROR!", "Failed to decode NFC tag.");
        } finally { check.hnStat.innerHTML = "NFC"; }
      };

      // (B2-2) ON NFC READ ERROR
      nfc.onerror = err => {
        nfc.stop();
        console.error(err);
        cb.modal("ERROR", err.message);
        check.hnStat.innerHTML = "ERROR";
      };

      // (B2-3) ENABLE NFC BUTTON
      check.hnBtn.onclick = () => {
        check.hnStat.innerHTML = "Scanning - Tap token";
        nfc.scan();
      };
      check.hnBtn.disabled = false;
    } else {
      check.hnStat.innerHTML = "Web NFC Not Supported";
    }

    // (B3) INIT AUTOCOMPLETE
    autocomplete.attach({
      target : document.getElementById("check-sku"),
      mod : "autocomplete", act : "sku"
    });
    autocomplete.attach({
      target : document.getElementById("check-batch"),
      mod : "autocomplete", act : "batch",
      data : { sku : document.getElementById("check-sku") }
    });
  },

  // (C) "SWITCH ON" QR SCANNER
  qron : () => {
    qrscan.init(txt => {
      try {
        let item = JSON.parse(txt);
        check.hSKU.value = item.S;
        check.hBatch.value = item.B;
        check.pre();
      } catch (e) {
        console.error(e);
        cb.modal("Invalid QR Code", "Failed to parse scanned QR code.");
      }
    });
    qrscan.show();
  },

  // (D) CHECK VALID SKU BEFORE LOADING HISTORY LIST
  pre : () => {
    cb.api({
      mod : "items", act : "check",
      data : {
        sku : check.hSKU.value,
        batch : check.hBatch.value
      },
      passmsg : false,
      onpass : res => {
        check.sku = check.hSKU.value;
        check.batch = check.hBatch.value;
        check.pg = 1;
        check.go();
      }
    });
    return false;
  },

  // (E) LOAD MOVEMENT HISTORY "MAIN PAGE"
  go : () => cb.load({
    page : "check-main", target : "cb-page-2",
    data : {
      sku : check.sku,
      batch : check.batch
    },
    onload : () => {
      cb.page(2);
      check.list();
    }
  }),

  // (F) SHOW ITEM MOVEMENT HISTORY
  list : () => cb.load({
    page : "check/list", target : "check-list",
    data : {
      sku : check.sku,
      batch : check.batch,
      page : check.pg
    }
  }),

  // (G) GO TO PAGE
  //  pg : int, page number
  goToPage : pg => { if (pg!=check.pg) {
    check.pg = pg;
    check.list();
  }}
};
window.addEventListener("load", check.init);