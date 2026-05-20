const API_BASE = "https://todo-api-208059972369.europe-central2.run.app";

const todoList = document.getElementById("todoList");
const todoForm = document.getElementById("todoForm");
const todoTitle = document.getElementById("todoTitle");
const refreshBtn = document.getElementById("refreshBtn");
const apiStatus = document.getElementById("apiStatus");
const apiBase = document.getElementById("apiBase");

apiBase.textContent = API_BASE;

async function checkApi() {
    try {
        const res = await fetch(`${API_BASE}/health`);
        if (!res.ok) {
            throw new Error("API not ok");
        }
        apiStatus.textContent = "API online";
        apiStatus.style.borderColor = "rgba(34, 211, 238, 0.4)";
    } catch (error) {
        apiStatus.textContent = "API offline";
        apiStatus.style.borderColor = "rgba(248, 113, 113, 0.6)";
    }
}

function formatTime(value) {
    if (!value) return "";
    const date = new Date(value);
    return date.toLocaleString();
}

function renderTodos(items) {
    todoList.innerHTML = "";
    if (!items.length) {
        todoList.innerHTML = "<li class=\"todo-item\">No tasks yet.</li>";
        return;
    }

    items.forEach((todo) => {
        const li = document.createElement("li");
        li.className = `todo-item ${todo.completed ? "completed" : ""}`;

        const meta = document.createElement("div");
        meta.className = "todo-meta";

        const title = document.createElement("span");
        title.className = "todo-title";
        title.textContent = todo.title;

        const time = document.createElement("span");
        time.className = "todo-time";
        time.textContent = `Updated: ${formatTime(todo.updatedAt)}`;

        meta.appendChild(title);
        meta.appendChild(time);

        const actions = document.createElement("div");
        actions.className = "todo-actions";

        const toggleBtn = document.createElement("button");
        toggleBtn.textContent = todo.completed ? "Undo" : "Done";
        toggleBtn.addEventListener("click", async () => {
            await updateTodo(todo.id, { completed: !todo.completed });
            await loadTodos();
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.addEventListener("click", async () => {
            await deleteTodo(todo.id);
            await loadTodos();
        });

        actions.appendChild(toggleBtn);
        actions.appendChild(deleteBtn);

        li.appendChild(meta);
        li.appendChild(actions);
        todoList.appendChild(li);
    });
}

async function loadTodos() {
    const res = await fetch(`${API_BASE}/todos`);
    const data = await res.json();
    renderTodos(data);
}

async function createTodo(title) {
    await fetch(`${API_BASE}/todos`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ title }),
    });
}

async function updateTodo(id, payload) {
    await fetch(`${API_BASE}/todos/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });
}

async function deleteTodo(id) {
    await fetch(`${API_BASE}/todos/${id}`, { method: "DELETE" });
}

todoForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!todoTitle.value.trim()) {
        return;
    }
    await createTodo(todoTitle.value.trim());
    todoTitle.value = "";
    await loadTodos();
});

refreshBtn.addEventListener("click", loadTodos);

checkApi();
loadTodos();
