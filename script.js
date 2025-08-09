let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

const balanceEl = document.getElementById("balance");
const transactionsEl = document.getElementById("transactions");
const addBtn = document.getElementById("addBtn");
const searchEl = document.getElementById("search");

const analyticsBox = document.createElement("div");
analyticsBox.classList.add("analytics");
document.querySelector(".app").appendChild(analyticsBox);

function updateUI(filteredTransactions = transactions) {
    transactionsEl.innerHTML = "";
    let balance = 0;

    filteredTransactions.forEach((t, index) => {
        const li = document.createElement("li");
        li.classList.add(t.type);
        li.innerHTML = `
            ${t.date} - ${t.desc} - ₹${t.amount} <small>[${t.category}]</small>
            <button onclick="deleteTransaction(${index})">❌</button>
        `;
        transactionsEl.appendChild(li);

        balance += t.type === "income" ? t.amount : -t.amount;
    });

    balanceEl.innerText = balance;
    localStorage.setItem("transactions", JSON.stringify(transactions));

    showAnalytics(filteredTransactions);
}

function addTransaction() {
    const desc = document.getElementById("desc").value;
    const amount = parseFloat(document.getElementById("amount").value);
    const type = document.getElementById("type").value;
    const category = document.getElementById("category").value;
    const date = document.getElementById("date").value;

    if (!desc || isNaN(amount) || amount <= 0 || !date) {
        alert("Please enter valid details!");
        return;
    }

    transactions.push({ desc, amount, type, category, date });
    document.getElementById("desc").value = "";
    document.getElementById("amount").value = "";
    document.getElementById("date").value = "";
    updateUI();
}

function deleteTransaction(index) {
    transactions.splice(index, 1);
    updateUI();
}

function showAnalytics(data) {
    if (data.length === 0) {
        analyticsBox.innerHTML = "<h3>No data for analytics</h3>";
        return;
    }

    let expenses = data.filter(t => t.type === "expense");

    // Group by month for average calculation
    let monthlyTotals = {};
    let categoryTotals = {};
    let yearlyTotals = {};

    expenses.forEach(exp => {
        let monthKey = exp.date.slice(0, 7); // YYYY-MM
        let yearKey = exp.date.slice(0, 4); // YYYY

        // Monthly totals
        if (!monthlyTotals[monthKey]) monthlyTotals[monthKey] = 0;
        monthlyTotals[monthKey] += exp.amount;

        // Yearly totals
        if (!yearlyTotals[yearKey]) yearlyTotals[yearKey] = 0;
        yearlyTotals[yearKey] += exp.amount;

        // Category totals per month
        let catKey = `${monthKey}-${exp.category}`;
        if (!categoryTotals[catKey]) categoryTotals[catKey] = 0;
        categoryTotals[catKey] += exp.amount;
    });

    // Calculate average monthly expenditure
    let months = Object.keys(monthlyTotals).length;
    let totalExpense = Object.values(monthlyTotals).reduce((a, b) => a + b, 0);
    let avgMonthly = (totalExpense / months).toFixed(2);

    // Find most expensive category each month
    let monthlyTopCategories = {};
    for (let key in categoryTotals) {
        let [month, category] = key.split("-");
        if (!monthlyTopCategories[month] || categoryTotals[key] > monthlyTopCategories[month].amount) {
            monthlyTopCategories[month] = { category, amount: categoryTotals[key] };
        }
    }

    // Find most expensive category each year
    let yearlyCategoryTotals = {};
    expenses.forEach(exp => {
        let year = exp.date.slice(0, 4);
        let catKey = `${year}-${exp.category}`;
        if (!yearlyCategoryTotals[catKey]) yearlyCategoryTotals[catKey] = 0;
        yearlyCategoryTotals[catKey] += exp.amount;
    });

    let yearlyTopCategories = {};
    for (let key in yearlyCategoryTotals) {
        let [year, category] = key.split("-");
        if (!yearlyTopCategories[year] || yearlyCategoryTotals[key] > yearlyTopCategories[year].amount) {
            yearlyTopCategories[year] = { category, amount: yearlyCategoryTotals[key] };
        }
    }

    // Display analytics
    analyticsBox.innerHTML = `
        <h3>📊 Analytics</h3>
        <p>Average Monthly Expenditure: ₹${avgMonthly}</p>
        <h4>Most Spent Category Each Month:</h4>
        <ul>
            ${Object.entries(monthlyTopCategories).map(([month, data]) => `<li>${month}: ${data.category} (₹${data.amount})</li>`).join("")}
        </ul>
        <h4>Most Spent Category Each Year:</h4>
        <ul>
            ${Object.entries(yearlyTopCategories).map(([year, data]) => `<li>${year}: ${data.category} (₹${data.amount})</li>`).join("")}
        </ul>
    `;
}

// Filter transactions as you type in search
searchEl.addEventListener("input", () => {
    const query = searchEl.value.toLowerCase();
    const filtered = transactions.filter(t =>
        t.desc.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query) ||
        t.date.includes(query)
    );
    updateUI(filtered);
});

addBtn.addEventListener("click", addTransaction);

updateUI();
