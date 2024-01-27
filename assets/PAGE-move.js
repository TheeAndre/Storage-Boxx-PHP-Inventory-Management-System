var move = {
  // (A) PROPERTIES
  hForm : null, // entire movement form
  hDir : null, hQty : null, hNote : null, // direction, qty, notes
  hSKU : null, hBatch : null, // sku, batch
  hnBtn : null, hnStat : null, // nfc
  hlQty : null, hlDir : null,  hlSKU : null, hlNote : null, // last entry

  // (B) INIT
  init : () => {
    // (B1) GET HTML FIELDS
    move.hForm = document.getElementById("mvt-form");
    move.hDir = document.getElementById("mvt-direction");
    move.hQty = document.getElementById("mvt-qty");
    move.hNote = document.getElementById("mvt-notes");
    move.hSKU = document.getElementById("mvt-sku");
    move.hBatch = document.getElementById("mvt-batch");
    move.hnBtn = document.getElementById("nfc-btn");
    move.hnStat = document.getElementById("nfc-stat");
    move.hlQty = document.getElementById("last-qty");
    move.hlDir = document.getElementById("last-mvt");
    move.hlSKU = document.getElementById("last-sku");
    move.hlNote = document.getElementById("last-notes");

    // (B2) INIT NFC
    if ("NDEFReader" in window) {
      // (B2-1) ON SUCCESSFUL NFC READ
      nfc.onread = evt => {
        try {
          nfc.standby();
          const decoder = new TextDecoder();
          let code = JSON.parse(decoder.decode(evt.message.records[0].data));
          move.hSKU.value = code.S;
          move.hBatch.value = code.B;
          if (move.hForm.checkValidity()) { move.save(); }
          else { move.hForm.reportValidity(); }
        } catch (e) {
          console.error(e);
          cb.modal("ERROR!", "Failed to decode NFC tag.");
        } finally { move.hnStat.innerHTML = "NFC"; }
      };

      // (B2-2) ON NFC READ ERROR
      nfc.onerror = err => {
        nfc.stop();
        console.error(err);
        cb.modal("ERROR", err.message);
        move.hnStat.innerHTML = "ERROR";
      };

      // (B2-3) ENABLE NFC BUTTON
      move.hnBtn.onclick = () => {
        move.hnStat.innerHTML = "Scanning - Tap token";
        nfc.scan();
      };
      move.hnBtn.disabled = false;
    } else {
      move.hnStat.innerHTML = "Web NFC Not Supported";
    }

    // (B3) INIT AUTOCOMPLETE
    autocomplete.attach({
      target : document.getElementById("mvt-sku"),
      mod : "autocomplete", act : "sku"
    });
    autocomplete.attach({
      target : document.getElementById("mvt-batch"),
      mod : "autocomplete", act : "batch",
      data : { sku : document.getElementById("mvt-sku") }
    });
  },

  // (C) "SWITCH ON" QR SCANNER
  qron : () => {
    if (qrscan.scanner==null) {
      qrscan.init(move.hSKU, move.hBatch, () => {
        if (move.hForm.checkValidity()) { move.save(); }
        else { move.hForm.reportValidity(); }
      });
    }
    qrscan.show();
  },

  // (D) SAVE MOVEMENT
  save : () => {
    cb.api({
      mod : "move", act : "saveM",
      data : {
        sku : move.hSKU.value,
        batch : move.hBatch.value,
        direction : move.hDir.value,
        qty : move.hQty.value,
        notes : move.hNote.value
      },
      passmsg : "Stock Movement Saved",
      onpass : res => {
        move.hlQty.innerHTML = move.hQty.value;
        move.hlSKU.innerHTML = `${move.hSKU.value} - ${move.hBatch.value}`;
        move.hlDir.innerHTML = move.hDir.options[move.hDir.selectedIndex].text;
        move.hlNote.innerHTML = move.hNote.value;
        move.hForm.reset();
      }
    });
    return false;
  }
};
window.addEventListener("load", move.init);