export function createDeepgramSocket(
  apiKey: string,
  onMessage: (data: any) => void
) {
  const socket = new WebSocket(
    "wss://api.deepgram.com/v1/listen" +
      "?model=nova-2" +
      "&encoding=linear16" +
      "&sample_rate=16000" +
      "&punctuate=true" +
      "&interim_results=true",
    ["token", apiKey]
  )

  socket.onmessage = (msg) => {
    onMessage(JSON.parse(msg.data))
  }

  return socket
}
