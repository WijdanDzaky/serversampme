const serverConfig = {
  ip: "coomingsoo",
  discordInvite: "coomingsoon",
  // Isi dari Supabase Project Settings > API.
  supabase: {
    url: "https://krtlsldaltsimzvfoimz.supabase.co",
    anonKey: "sb_publishable_2UTpf-2TrXNUVcF2XEEOcA_hmJk_2VE",
  },
  // Alternatif backend: endpoint ini harus mengembalikan { messages: [] }.
  discordMessagesEndpoint: "",
};

const toast = document.querySelector("#toast");
const copyButton = document.querySelector("#copy-ip");
const serverIp = document.querySelector("#server-ip");
const chatForm = document.querySelector("#chat-form");
const chatName = document.querySelector("#chat-name");
const chatMessage = document.querySelector("#chat-message");
const messages = document.querySelector("#messages");
const chatConnection = document.querySelector("#chat-connection");
const savedName = localStorage.getItem("nr-chat-name");
let supabaseClient = null;

if (savedName) chatName.value = savedName;

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

function addMessage({ author, content, time = "baru saja" }) {
  const message = document.createElement("div");
  message.className = "message";
  const initials = author.slice(0, 2).toUpperCase();
  message.innerHTML = `<div class="avatar avatar-blue">${initials}</div><div><strong></strong><time>${time}</time><p></p></div>`;
  message.querySelector("strong").textContent = author;
  message.querySelector("p").textContent = content;
  messages.appendChild(message);
  messages.scrollTop = messages.scrollHeight;
}

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const author = chatName.value.trim() || "visitor";
  const text = chatMessage.value.trim();
  if (!text) return;
  localStorage.setItem("nr-chat-name", author);
  if (supabaseClient) {
    supabaseClient
      .from("messages")
      .insert({ author, content: text })
      .then(({ error }) => {
        if (error) {
          console.warn("Pesan gagal dikirim:", error);
          chatConnection.textContent = "Gagal kirim - cek policy";
          addMessage({ author, content: text });
        }
      });
  } else {
    addMessage({ author, content: text });
  }
  chatMessage.value = "";
});

async function connectRealtimeChat() {
  const config = serverConfig.supabase;
  if (!window.supabase || !config.url || !config.anonKey) {
    chatConnection.textContent = "Mode demo - isi Supabase";
    return;
  }
  try {
    supabaseClient = window.supabase.createClient(config.url, config.anonKey);
    const { data, error } = await supabaseClient
      .from("messages")
      .select("id, author, content, created_at")
      .order("created_at", { ascending: true })
      .limit(50);
    if (error) throw error;
    data.forEach((message) =>
      addMessage({
        author: message.author,
        content: message.content,
        time: formatMessageTime(message.created_at),
      }),
    );
    chatConnection.textContent = "Semua orang bisa chat";
    supabaseClient
      .channel("public-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          addMessage({
            author: payload.new.author,
            content: payload.new.content,
            time: formatMessageTime(payload.new.created_at),
          });
        },
      )
      .subscribe();
  } catch (error) {
    console.warn("Supabase chat belum terhubung:", error);
    chatConnection.textContent = "Supabase belum siap";
  }
}

function formatMessageTime(value) {
  if (!value) return "baru saja";
  return new Date(value).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

connectRealtimeChat();

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
