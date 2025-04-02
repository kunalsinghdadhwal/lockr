

"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { MessageSquare, Send, X, Loader2, Mic, MicOff, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type Message = {
  id: string
  content: string
  role: "user" | "assistant"
}

// Update the NAVIGATION_INTENTS object to include more variations
const NAVIGATION_INTENTS: Record<string, { path: string; response: string }> = {
  "sign-in": {
    path: "/sign-in",
    response: "Taking you to the sign-in page...",
  },
  signin: {
    path: "/sign-in",
    response: "Navigating to the sign-in page...",
  },
  login: {
    path: "/sign-in",
    response: "Directing you to the login page...",
  },
  "log in": {
    path: "/sign-in",
    response: "Taking you to the login page...",
  },
  "sign in page": {
    path: "/sign-in",
    response: "Going to the sign-in page...",
  },
  "login page": {
    path: "/sign-in",
    response: "Taking you to the login page...",
  },
  "sign-up": {
    path: "/sign-up",
    response: "Taking you to the sign-up page...",
  },
  signup: {
    path: "/sign-up",
    response: "Navigating to the sign-up page...",
  },
  register: {
    path: "/sign-up",
    response: "Directing you to the registration page...",
  },
  "create account": {
    path: "/sign-up",
    response: "Let's get you set up with a new account...",
  },
  "new account": {
    path: "/sign-up",
    response: "Setting up a new account for you...",
  },
  "sign up page": {
    path: "/sign-up",
    response: "Going to the sign-up page...",
  },
  "registration page": {
    path: "/sign-up",
    response: "Taking you to the registration page...",
  },
  dashboard: {
    path: "/dashboard",
    response: "Opening your dashboard...",
  },
  "my dashboard": {
    path: "/dashboard",
    response: "Taking you to your dashboard...",
  },
  "account dashboard": {
    path: "/dashboard",
    response: "Opening your account dashboard...",
  },
  "user dashboard": {
    path: "/dashboard",
    response: "Taking you to your user dashboard...",
  },
  home: {
    path: "/",
    response: "Going back to the home page...",
  },
  "main page": {
    path: "/",
    response: "Returning to the main page...",
  },
  "landing page": {
    path: "/",
    response: "Taking you to the landing page...",
  },
  "start page": {
    path: "/",
    response: "Going to the start page...",
  },
}

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! How can I help you navigate the site today? You can type or use the microphone button to speak.",
      role: "assistant",
    },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Update the useEffect for speech recognition to improve browser compatibility
  // Check if speech recognition and synthesis are supported
  useEffect(() => {
    const isSpeechRecognitionSupported = "SpeechRecognition" in window || "webkitSpeechRecognition" in window
    setSpeechSupported(isSpeechRecognitionSupported)

    // Initialize text-to-speech on component mount
    if ("speechSynthesis" in window) {
      speechSynthesisRef.current = new SpeechSynthesisUtterance()

      // Add event listener for when speech ends
      speechSynthesisRef.current.onend = () => {
        setIsSpeaking(false)
      }

      // Pre-load voices for better performance
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.getVoices()
        }
      }
    } else {
      console.warn("Text-to-Speech Not Supported")
      setTtsEnabled(false)
    }

    // Cleanup function to cancel any ongoing speech when component unmounts
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  // Scroll to bottom of messages when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Handle chat input submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    await processUserInput(input)
  }

  // Process user input (text or speech)
  const processUserInput = async (userInput: string) => {
    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      content: userInput,
      role: "user",
    }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Process the user's message
      const response = await processMessage(userInput)

      // Add assistant response to chat
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.message,
        role: "assistant",
      }
      setMessages((prev) => [...prev, assistantMessage])

      // Speak the response if TTS is enabled
      if (ttsEnabled) {
        speakText(response.message)
      }

      // Handle navigation if needed
      if (response.navigate) {
        setTimeout(() => {
          router.push(response.navigate)
        }, 1000)
      }
    } catch (error) {
      console.error("Error processing message:", error)
      const errorMessage = "I'm sorry, I encountered an error. Please try again."
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          content: errorMessage,
          role: "assistant",
        },
      ])
      if (ttsEnabled) {
        speakText(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Text-to-speech function
  const speakText = (text: string) => {
    if (!ttsEnabled || !("speechSynthesis" in window) || !speechSynthesisRef.current) return

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    // Configure speech options
    const utterance = speechSynthesisRef.current
    utterance.text = text
    utterance.lang = "en-US"
    utterance.rate = 1.0
    utterance.pitch = 1.0
    utterance.volume = 1.0

    // Select a voice (optional)
    const voices = window.speechSynthesis.getVoices()
    // Try to find a female voice for the assistant
    const femaleVoice = voices.find(
      (voice) =>
        voice.name.includes("Female") ||
        voice.name.includes("Samantha") ||
        voice.name.includes("Google UK English Female"),
    )

    if (femaleVoice) {
      utterance.voice = femaleVoice
    }

    // Start speaking
    setIsSpeaking(true)
    window.speechSynthesis.speak(utterance)
  }

  // Toggle TTS on/off
  const toggleTTS = () => {
    // If turning off TTS while speaking, stop any ongoing speech
    if (ttsEnabled && isSpeaking && "speechSynthesis" in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
    setTtsEnabled(!ttsEnabled)

    // No toast notification here
  }

  // Stop TTS
  const stopSpeaking = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }

  // Replace the startListening function with this improved version
  const startListening = () => {
    if (!speechSupported) {
      console.error("Speech Recognition Not Supported")
      return
    }

    try {
      setIsListening(true)

      // Use the appropriate speech recognition API
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()

      recognition.lang = "en-US"
      recognition.interimResults = false
      recognition.maxAlternatives = 3 // Increase alternatives to improve accuracy
      recognition.continuous = false

      recognition.onstart = () => {
        setIsListening(true)
        // No toast notification here
      }

      recognition.onresult = (event) => {
        // Get the most confident result
        const transcript = event.results[0][0].transcript
        setInput(transcript)

        // No toast notification here

        // Automatically process the speech input
        processUserInput(transcript)
      }

      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error)
        setIsListening(false)

        // No toast notifications for errors, just log to console
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.start()
    } catch (error) {
      console.error("Error starting speech recognition:", error)
      setIsListening(false)
    }
  }

  // Stop speech recognition
  const stopListening = () => {
    setIsListening(false)

    // Use the appropriate speech recognition API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.stop()
  }

  // Replace the processMessage function with this enhanced version
  const processMessage = async (message: string): Promise<{ message: string; navigate?: string }> => {
    const lowerMessage = message.toLowerCase().trim()

    // First, check for exact matches in our navigation intents
    for (const [intent, { path, response }] of Object.entries(NAVIGATION_INTENTS)) {
      // Check for exact matches or if the intent is contained in the message
      if (lowerMessage === intent || lowerMessage.includes(intent)) {
        return {
          message: response,
          navigate: path,
        }
      }
    }

    // Next, check for phrases like "go to X", "take me to X", "navigate to X"
    const navigationPhrases = [
      "go to",
      "take me to",
      "navigate to",
      "open",
      "show me",
      "i want to",
      "i need to",
      "can you show me",
      "please open",
      "please show",
      "bring me to",
      "direct me to",
      "access",
      "visit",
      "view",
      "get to",
      "lead me to",
      "help me",
      "show",
      "move to",
      "switch to",
    ]

    for (const phrase of navigationPhrases) {
      if (lowerMessage.includes(phrase)) {
        // Extract what comes after the phrase
        const afterPhrase = lowerMessage.split(phrase)[1]?.trim()

        if (afterPhrase) {
          // Check if what comes after matches any of our intents
          for (const [intent, { path, response }] of Object.entries(NAVIGATION_INTENTS)) {
            if (
              afterPhrase.includes(intent) ||
              // Handle cases like "sign in" vs "signin"
              afterPhrase.replace(/\s+/g, "") === intent.replace(/\s+/g, "") ||
              // Handle cases like "sign in" vs "sign-in"
              afterPhrase.replace(/\s+/g, "") === intent.replace(/-/g, "") ||
              // Handle cases with typos
              (intent.length > 4 &&
                afterPhrase.replace(/\s+/g, "").includes(intent.replace(/\s+/g, "").substring(0, intent.length - 2)))
            ) {
              return {
                message: response,
                navigate: path,
              }
            }
          }
        }
      }
    }

    // Check for specific action phrases
    if (
      lowerMessage.includes("log me in") ||
      lowerMessage.includes("let me in") ||
      lowerMessage.includes("want to log in") ||
      lowerMessage.includes("need to log in") ||
      lowerMessage.includes("sign me in") ||
      lowerMessage.includes("authenticate") ||
      lowerMessage.includes("access my account")
    ) {
      return {
        message: "Taking you to the sign-in page...",
        navigate: "/sign-in",
      }
    }

    if (
      lowerMessage.includes("create an account") ||
      lowerMessage.includes("make an account") ||
      lowerMessage.includes("want to register") ||
      lowerMessage.includes("want to sign up") ||
      lowerMessage.includes("need to register") ||
      lowerMessage.includes("need to sign up") ||
      lowerMessage.includes("new user") ||
      lowerMessage.includes("join") ||
      lowerMessage.includes("become a member")
    ) {
      return {
        message: "Taking you to the sign-up page...",
        navigate: "/sign-up",
      }
    }

    if (
      lowerMessage.includes("show my dashboard") ||
      lowerMessage.includes("view my dashboard") ||
      lowerMessage.includes("go to my dashboard") ||
      lowerMessage.includes("my account") ||
      lowerMessage.includes("my profile") ||
      lowerMessage.includes("account overview") ||
      lowerMessage.includes("my page")
    ) {
      return {
        message: "Opening your dashboard...",
        navigate: "/dashboard",
      }
    }

    // Check for TTS related commands
    if (
      lowerMessage.includes("stop speaking") ||
      lowerMessage.includes("stop talking") ||
      lowerMessage.includes("be quiet") ||
      lowerMessage.includes("mute") ||
      lowerMessage.includes("silence")
    ) {
      stopSpeaking()
      return {
        message: "I've stopped speaking. You can turn voice responses back on using the volume button.",
      }
    }

    if (
      lowerMessage.includes("speak to me") ||
      lowerMessage.includes("talk to me") ||
      lowerMessage.includes("voice on") ||
      lowerMessage.includes("enable voice") ||
      lowerMessage.includes("enable audio")
    ) {
      setTtsEnabled(true)
      return {
        message: "Voice responses are now enabled. I'll speak my responses out loud.",
      }
    }

    if (
      lowerMessage.includes("stop voice") ||
      lowerMessage.includes("disable voice") ||
      lowerMessage.includes("disable audio") ||
      lowerMessage.includes("voice off") ||
      lowerMessage.includes("turn off voice")
    ) {
      stopSpeaking()
      setTtsEnabled(false)
      return {
        message: "Voice responses are now disabled. I'll respond in text only.",
      }
    }

    // Enhanced contextual help based on current page
    if (pathname === "/sign-in") {
      if (lowerMessage.includes("help") || lowerMessage.includes("how") || lowerMessage.includes("what")) {
        return {
          message:
            "You're currently on the sign-in page. You can enter your email and password to access your account. If you've forgotten your password, you can use the 'Forgot Password' link. Don't have an account yet? Just say 'take me to sign-up' and I'll help you create one.",
        }
      }
    } else if (pathname === "/sign-up") {
      if (lowerMessage.includes("help") || lowerMessage.includes("how") || lowerMessage.includes("what")) {
        return {
          message:
            "You're on the sign-up page where you can create a new account. Fill out the form with your details to get started. If you already have an account, just say 'take me to sign-in' and I'll direct you to the login page.",
        }
      }
    } else if (pathname === "/dashboard") {
      if (lowerMessage.includes("help") || lowerMessage.includes("how") || lowerMessage.includes("what")) {
        return {
          message:
            "You're viewing your dashboard. Here you can see an overview of your account and access all the main features of the application. You can navigate to different sections using the menu or ask me to help you find specific features.",
        }
      }
    }

    // General help responses
    if (lowerMessage.includes("help")) {
      return {
        message:
          "I can help you navigate the site. Try asking me to take you to pages like 'go to sign-in', 'take me to sign-up', or 'open dashboard'. You can also ask for help on the current page by saying 'what can I do here?'",
      }
    }

    if (
      lowerMessage.includes("voice") ||
      lowerMessage.includes("speak") ||
      lowerMessage.includes("talk") ||
      lowerMessage.includes("microphone")
    ) {
      return {
        message:
          "You can use voice commands by clicking the microphone button. When the microphone turns red and is pulsing, I'm listening. Speak clearly and say things like 'Take me to the dashboard', 'I want to sign up', or 'Help me navigate'. You can also toggle my voice responses using the volume button.",
      }
    }

    // If we couldn't understand the command
    if (lowerMessage.length > 0) {
      return {
        message: `I'm not sure what you meant by "${message}". You can ask me to navigate to different pages like sign-in, sign-up, or dashboard. Or you can ask for help by saying "help" or "what can I do here?"`,
      }
    }

    // Default response with more helpful suggestions
    return {
      message:
        "I'm here to help you navigate the site. You can ask me to take you to pages like sign-in, sign-up, or dashboard. If you need help with the current page, just ask 'What can I do here?' or 'Help me understand this page.'",
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <Card className="w-80 sm:w-96 h-96 flex flex-col shadow-lg border border-border">
          <div className="flex items-center justify-between p-3 border-b">
            <h3 className="font-medium">Chat Assistant</h3>
            <div className="flex items-center space-x-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleTTS}
                      aria-label={ttsEnabled ? "Disable voice responses" : "Enable voice responses"}
                    >
                      {ttsEnabled ? (
                        <Volume2 className={cn("h-4 w-4", isSpeaking && "text-primary")} />
                      ) : (
                        <VolumeX className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{ttsEnabled ? "Disable voice responses" : "Enable voice responses"}</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex max-w-[80%] rounded-lg p-3",
                  message.role === "user" ? "bg-primary text-primary-foreground ml-auto" : "bg-muted",
                )}
              >
                {message.content}
              </div>
            ))}
            {isLoading && (
              <div className="flex max-w-[80%] rounded-lg p-3 bg-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSubmit} className="p-3 border-t flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
              disabled={isLoading || isListening}
            />

            {speechSupported && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      size="icon"
                      variant={isListening ? "destructive" : "outline"}
                      onClick={isListening ? stopListening : startListening}
                      disabled={isLoading}
                      className={cn(
                        "transition-all relative",
                        isListening && "animate-pulse bg-red-500 hover:bg-red-600",
                      )}
                      aria-label={isListening ? "Stop listening" : "Start voice input"}
                    >
                      {isListening ? (
                        <>
                          <Mic className="h-4 w-4 text-white" />
                          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                        </>
                      ) : (
                        <MicOff className="h-4 w-4" />
                      )}
                      <span className="sr-only">{isListening ? "Stop listening" : "Start voice input"}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isListening ? "I'm listening... Click to stop" : "Click to speak a command"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            <Button
              type="submit"
              size="icon"
              disabled={isLoading || isListening || !input.trim()}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Send message</span>
            </Button>
          </form>
        </Card>
      ) : (
        <Button onClick={() => setIsOpen(true)} className="h-12 w-12 rounded-full shadow-lg">
          <MessageSquare className="h-6 w-6" />
        </Button>
      )}
    </div>
  )
}

