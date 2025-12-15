import { useEffect, useRef, useState } from "react"
import { listen } from "@tauri-apps/api/event"
import { AudioRecorder } from "../audio/recorder"
import { createDeepgramSocket } from "../deepgram/client"
import "./App.css"

const API_KEY = import.meta.env.VITE_DEEPGRAM_KEY

export default function App() {
  const recorderRef = useRef<AudioRecorder | null>(null)
  const socketRef = useRef<WebSocket | null>(null)
  const recordingRef = useRef(false)

  const [recording, setRecording] = useState(false)
  const [finalText, setFinalText] = useState("")
  const [interimText, setInterimText] = useState("")

  // keep ref in sync
  useEffect(() => {
    recordingRef.current = recording
  }, [recording])

  // ─────────────────────────────────────────────
  // Start recording
  // ─────────────────────────────────────────────
  const start = async () => {
    if (recordingRef.current) return

    recorderRef.current = new AudioRecorder()

    socketRef.current = createDeepgramSocket(API_KEY, (data) => {
      const alt = data.channel?.alternatives?.[0]
      if (!alt?.transcript) return

      if (data.is_final) {
        setFinalText(prev => (prev + " " + alt.transcript).trim())
        setInterimText("")
      } else {
        setInterimText(alt.transcript)
      }
    })

    await recorderRef.current.start((chunk) => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(chunk)
      }
    })

    setRecording(true)
  }

  // ─────────────────────────────────────────────
  // Stop recording (flush Deepgram)
  // ─────────────────────────────────────────────
  const stop = () => {
    if (!recordingRef.current) return

    recorderRef.current?.stop()

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "CloseStream" }))
      socketRef.current.close()
    }

    setRecording(false)
  }

  // ─────────────────────────────────────────────
  // Global shortcut listener (Ctrl + Shift + Space)
  // ─────────────────────────────────────────────
  useEffect(() => {
    let unlisten: (() => void) | null = null

    listen("toggle-recording", () => {
      recordingRef.current ? stop() : start()
    }).then(fn => {
      unlisten = fn
    })

    return () => {
      if (unlisten) unlisten()
    }
  }, [])

  // ─────────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────────
  return (
    <div className="root">
      <div className="note-card">
        <h2>For quick thoughts you want to come back to</h2>

        <textarea
          value={`${finalText} ${interimText}`.trim()}
          readOnly
          placeholder="Hold the mic and speak"
        />

        <div className="controls">
          <button
            className={`mic ${recording ? "recording" : ""}`}
            onMouseDown={start}
            onMouseUp={stop}
          >
            🎤
          </button>

          <button className="finish">Finish</button>
        </div>
      </div>
    </div>
  )
}
