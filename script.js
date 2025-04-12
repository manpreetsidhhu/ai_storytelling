document.addEventListener("DOMContentLoaded", () => {
  const chatMessages = document.getElementById("chat-messages");
  const userInput = document.getElementById("user-input");
  const sendButton = document.getElementById("send-btn");
  const storyOptions = document.querySelectorAll(".story-option");
  const themeToggle = document.querySelector(".theme-toggle");
  const imageInput = document.getElementById("image-input");
  const loadingIndicator = document.getElementById("loading-indicator");
  const clearHistoryButton = document.getElementById("clear-history");

  const API_KEY = "AIzaSyBCqsf4uJ55nlw1_j6gvzYVkFb2Fgx_iG4";
  const API_URL =
    "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent";

  let chatHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];

  if (chatHistory.length > 0) {
    chatHistory.forEach((message) => {
      if (message.role === "user") {
        addUserMessage(message.content, message.timestamp);
      } else {
        addBotMessage(message.content, message.timestamp);
      }
    });
    scrollToBottom();
  } else {
    const welcomeMessage =
      "Hello! I'm your AI storytelling companion. I can tell you stories about anything you imagine. What would you like to hear about today?";
    addBotMessage(welcomeMessage);
    chatHistory.push({
      role: "bot",
      content: welcomeMessage,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });
    saveHistory();
  }

  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light-theme");
    const icon = themeToggle.querySelector("i");

    if (document.body.classList.contains("light-theme")) {
      icon.classList.remove("fa-moon");
      icon.classList.add("fa-sun");
    } else {
      icon.classList.remove("fa-sun");
      icon.classList.add("fa-moon");
    }

    localStorage.setItem(
      "theme",
      document.body.classList.contains("light-theme") ? "light" : "dark"
    );
  });

  if (localStorage.getItem("theme") === "light") {
    document.body.classList.add("light-theme");
    themeToggle.querySelector("i").classList.remove("fa-moon");
    themeToggle.querySelector("i").classList.add("fa-sun");
  }

  storyOptions.forEach((option) => {
    option.addEventListener("click", () => {
      const prompt = option.getAttribute("data-prompt");
      userInput.value = prompt;
      handleSendMessage();
    });
  });

  let selectedImage = null;
  imageInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      selectedImage = file;
      const label = imageInput.previousElementSibling;
      label.style.backgroundColor = "var(--secondary-color)";
    }
  });

  function handleSendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    addUserMessage(message);

    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    chatHistory.push({
      role: "user",
      content: message,
      timestamp: timestamp,
    });
    saveHistory();

    userInput.value = "";

    generateResponse(message, selectedImage);

    if (selectedImage) {
      selectedImage = null;
      const label = imageInput.previousElementSibling;
      label.style.backgroundColor = "var(--primary-color)";
      imageInput.value = "";
    }
  }

  sendButton.addEventListener("click", handleSendMessage);

  userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  });

  function showCustomAlert() {
    const customAlert = document.getElementById("custom-alert");
    customAlert.classList.remove("hidden");
  }

  function hideCustomAlert() {
    const customAlert = document.getElementById("custom-alert");
    customAlert.classList.add("hidden");
  }

  clearHistoryButton.addEventListener("click", () => {
    showCustomAlert();

    const confirmButton = document.getElementById("confirm-clear");
    const cancelButton = document.getElementById("cancel-clear");

    confirmButton.onclick = () => {
      chatMessages.innerHTML = "";
      chatHistory = [];
      localStorage.removeItem("chatHistory");

      const welcomeMessage =
        "Chat history cleared. What story would you like to hear now?";
      addBotMessage(welcomeMessage);
      chatHistory.push({
        role: "bot",
        content: welcomeMessage,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
      saveHistory();

      hideCustomAlert();
    };

    cancelButton.onclick = () => {
      hideCustomAlert();
    };
  });

  async function generateResponse(userPrompt, imageFile = null) {
    showLoading();

    try {
      const storyLength = document.getElementById("story-length").value;
      const storyStyle = document.getElementById("story-style").value;
      const storyTone = document.getElementById("story-tone").value;

      const lengthGuide = {
        short:
          "Create a concise story in 1-2 short paragraphs (approximately 60-120 words)",
        medium:
          "Create a balanced story in 3-5 paragraphs (approximately 200-400 words)",
        long: "Create a detailed story in 4+ paragraphs (approximately 500-700 words)",
      };

      const styleGuide = {
        descriptive:
          "Use vivid imagery and detailed descriptions to paint a picture in the reader's mind",
        conversational:
          "Tell the story in a casual, friendly tone as if sharing with a friend",
        poetic: "Incorporate poetic elements, metaphors, and rhythmic language",
        humorous:
          "Include light-hearted elements and gentle humor while maintaining respect for the subject",
      };

      const toneGuide = {
        light: "Keep the mood uplifting and positive",
        neutral: "Maintain a balanced and objective tone",
        dark: "Explore deeper, more serious themes while staying appropriate",
        whimsical: "Add magical and fantastical elements to the narrative",
      };

      const systemPrompt = `You are a creative storyteller capable of crafting engaging and imaginative stories.

STRICT LENGTH REQUIREMENT: ${lengthGuide[storyLength]}
WRITING STYLE: ${styleGuide[storyStyle]}
TONE: ${toneGuide[storyTone]}

Additional guidelines:
- Include proper narrative structure with a clear beginning, middle, and end
- Focus on the moral or lesson when relevant
- Adapt the language complexity to match the chosen style
- Stay within the specified length limit strictly
- Avoid using any explicit or inappropriate content
- Avoid hard english words/vocalbulary
- Use max humanized english, make it easy to understand, more indian-english, not the US or British english
- Use simple words, no complex words, no complex sentences, no complex phrases
- If you are prompted in which language, provide the answer in that language
- if you are prompted with "in punjabi" then do answer in punjabi langauge, and if "in hindi" then do in hindi and so on.
- use easiest english vocabulary, use common words of the language, not always be the story in character and narration, sometimes it could be theory.

Please generate a story about: ${userPrompt}`;

      let requestBody = {
        contents: [
          {
            role: "user",
            parts: [{ text: systemPrompt }, { text: userPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 800,
        },
      };

      if (imageFile) {
        const base64Image = await fileToBase64(imageFile);
        requestBody.contents[0].parts.push({
          inlineData: {
            mimeType: imageFile.type,
            data: base64Image.split(",")[1],
          },
        });
      }

      const response = await fetch(`${API_URL}?key=${API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to generate story");
      }

      const story =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "I'm sorry, I couldn't generate a story at this time. Please try again with a different prompt.";

      const timestamp = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      addBotMessage(story, timestamp);

      chatHistory.push({
        role: "bot",
        content: story,
        timestamp: timestamp,
      });
      saveHistory();
    } catch (error) {
      console.error("Error generating response:", error);
      const errorMessage =
        "I apologize, but I encountered an error while creating your story. Please try again with a different prompt.";
      addBotMessage(errorMessage);

      chatHistory.push({
        role: "bot",
        content: errorMessage,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
      saveHistory();
    } finally {
      hideLoading();
      scrollToBottom();
    }
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  }

  function showLoading() {
    loadingIndicator.classList.add("visible");
  }

  function hideLoading() {
    loadingIndicator.classList.remove("visible");
  }

  function addUserMessage(message, time = null) {
    const timestamp =
      time ||
      new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const html = `
            <div class="message user-message">
                <div class="message-content">${message}</div>
                <div class="message-time">${timestamp}</div>
            </div>
        `;
    chatMessages.insertAdjacentHTML("beforeend", html);
    scrollToBottom();
  }

  function addBotMessage(message, time = null) {
    const timestamp =
      time ||
      new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const html = `
            <div class="message bot-message">
                <div class="message-content">${message}</div>
                <div class="message-time">${timestamp}</div>
            </div>
        `;
    chatMessages.insertAdjacentHTML("beforeend", html);
    scrollToBottom();
  }

  function saveHistory() {
    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
  }

  function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
});
