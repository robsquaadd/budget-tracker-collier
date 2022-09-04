let db;
const request = indexedDB.open("budget_tracker", 1);
request.onupgradeneeded = function (event) {
  const db = event.target.result;
  db.createObjectStore("new_transaction", { autoIncrement: true });
};
request.onsuccess = function (event) {
  db = event.target.result;
  if (navigator.onLine) {
    uploadTransactions();
  }
};
request.onerror = function (event) {
  console.log(event.target.errorCode);
};
function saveRecord(record) {
  const transaction = db.transaction(["new_transaction"], "readwrite");
  const transactionObjectStore = transaction.objectStore("new_transaction");
  transactionObjectStore.add(record);
}
function uploadTransactions() {
  const transaction = db.transaction(["new_transaction"], "readwrite");
  const transactionObjectStore = transaction.objectStore("new_transaction");
  const getAll = transactionObjectStore.getAll();
  getAll.onsuccess = async function () {
    try {
      const response = await fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      });
      const serverResponse = await response.json();
      if (serverResponse.message) {
        throw new Error(serverResponse);
      }
      const transaction = db.transaction(["new_transaction"], "readwrite");
      const transactionObjectStore = transaction.objectStore("new_transaction");
      transactionObjectStore.clear();
    } catch (err) {
      console.log(err);
    }
  };
}

window.addEventListener("online", uploadTransactions);
