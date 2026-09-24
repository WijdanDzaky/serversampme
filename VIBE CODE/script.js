const serverConfig = {
  ip: "coomingsoo",
  discordInvite: "coomingsoon",
  // Set this to your own backend endpoint that returns { messages: [] }.
  discordMessagesEndpoint: "",
};

const toast = document.querySelector("#toast");
const copyButton = document.querySelector("#copy-ip");
const serverIp = document.querySelector("#server-ip");
const chatForm = document.querySelector("#chat-form");
const chatMessage = document.querySelector("#chat-message");
const messages = document.querySelector("#messages");

serverIp.textContent = serverConfig.ip;
document.querySelectorAll('a[href="https://discord.com"]').forEach((link) => {
  link.href = serverConfig.discordInvite;
});

copyButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(serverConfig.ip);
    toast.textContent = "Alamat server berhasil disalin.";
  } catch {
    toast.textContent = `Salin manual: ${serverConfig.ip}`;
  }
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2200);
});

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = chatMessage.value.trim();
  if (!text) return;
  const message = document.createElement("div");
  message.className = "message";
  message.innerHTML = `<div class="avatar avatar-blue">YOU</div><div><strong>visitor <time>baru saja</time></strong><p></p></div>`;
  message.querySelector("p").textContent = text;
  messages.appendChild(message);
  chatMessage.value = "";
  messages.scrollTop = messages.scrollHeight;
});

async function loadDiscordMessages() {
  if (!serverConfig.discordMessagesEndpoint) return;
  try {
    const response = await fetch(serverConfig.discordMessagesEndpoint);
    if (!response.ok) throw new Error("Discord endpoint unavailable");
    const data = await response.json();
    if (!Array.isArray(data.messages)) return;
    messages.replaceChildren();
    data.messages.forEach(
      ({ author = "member", time = "baru saja", content = "" }) => {
        const message = document.createElement("div");
        message.className = "message";
        message.innerHTML = `<div class="avatar avatar-blue">${author.slice(0, 2).toUpperCase()}</div><div><strong></strong><time>${time}</time><p></p></div>`;
        message.querySelector("strong").textContent = author;
        message.querySelector("p").textContent = content;
        messages.appendChild(message);
      },
    );
  } catch (error) {
    console.warn("Discord messages could not be loaded:", error);
  }
}

loadDiscordMessages();

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("reveal");
    });
  },
  { threshold: 0.12 },
);
document
  .querySelectorAll(".section, .feature, .chat-window, .community-aside")
  .forEach((element) => observer.observe(element));
