# Run LLMs Locally (Ollama / Local models)

Run powerful AI models on your own hardware for privacy, cost savings, and offline access. This guide covers Ollama, LM Studio, and alternative solutions with real examples.

## Why Run LLMs Locally?

- **Privacy** - Your data never leaves your device
- **Cost** - No API fees after initial hardware investment
- **Offline** - Works without internet connection
- **Control** - Full customization and model selection
- **Speed** - No network latency for certain hardware

---

## System Requirements

### Minimum (Small models like 7B)
- **RAM:** 8GB
- **Storage:** 10GB free
- **GPU:** Optional (Apple Silicon works great)

### Recommended (Medium models 13B-34B)
- **RAM:** 16GB+
- **VRAM:** 8GB+ (NVIDIA RTX 3060+, AMD 7600 XT+)
- **Storage:** 50GB+ SSD

### Optimal (Large models 70B+)
- **RAM:** 32GB+
- **VRAM:** 24GB+ (NVIDIA RTX 4090, A100)
- **Storage:** 100GB+ NVMe SSD

---

## Option 1: Ollama (Recommended for Developers)

### Installation

**macOS:**
```bash
# Download from ollama.com or use Homebrew
brew install ollama

# Or download the app
# Visit: https://ollama.com/download
```

**Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh

# Or manual install
curl -L https://ollama.com/download/ollama-linux-amd64 -o /usr/local/bin/ollama
chmod +x /usr/local/bin/ollama
```

**Windows:**
```bash
# Download installer from ollama.com
# Or use WSL2 with Linux instructions
```

### Starting Ollama

```bash
# Start the server (runs in background)
ollama serve

# The server runs on http://localhost:11434
```

### Pulling Models

**Popular models:**
```bash
# Llama 3.1 (8B) - Great all-rounder
ollama pull llama3.1

# Llama 3.3 (70B) - Most capable
ollama pull llama3.3

# Mistral (7B) - Fast and efficient
ollama pull mistral

# Phi-3 (3.8B) - Tiny but capable
ollama pull phi3

# DeepSeek Coder (6.7B) - Best for coding
ollama pull deepseek-coder

# Gemma 2 (9B) - Google's model
ollama pull gemma2

# Code Llama (7B) - Meta's coding model
ollama pull codellama

# Qwen 2.5 (7B) - Multilingual excellence
ollama pull qwen2.5
```

**Check available models:**
```bash
ollama list
```

### Running Models

**Interactive chat:**
```bash
# Start chatting
ollama run llama3.1

# Exit with /bye or Ctrl+D
```

**Single prompt:**
```bash
ollama run llama3.1 "Explain quantum computing in simple terms"
```

**With parameters:**
```bash
ollama run llama3.1 --verbose "Write a Python function to sort a list"
```

### Using Ollama API

**Basic cURL example:**
```bash
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.1",
  "prompt": "Why is the sky blue?",
  "stream": false
}'
```

**Streaming response:**
```bash
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.1",
  "prompt": "Write a haiku about coding",
  "stream": true
}'
```

**Chat API:**
```bash
curl http://localhost:11434/api/chat -d '{
  "model": "llama3.1",
  "messages": [
    {
      "role": "user",
      "content": "What is recursion?"
    }
  ]
}'
```

### Integration Examples

**Python:**
```python
import requests
import json

def chat_with_ollama(prompt, model="llama3.1"):
    url = "http://localhost:11434/api/generate"
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False
    }
    
    response = requests.post(url, json=payload)
    return response.json()['response']

# Usage
result = chat_with_ollama("Explain machine learning")
print(result)
```

**Streaming in Python:**
```python
import requests
import json

def stream_ollama(prompt, model="llama3.1"):
    url = "http://localhost:11434/api/generate"
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": True
    }
    
    with requests.post(url, json=payload, stream=True) as response:
        for line in response.iter_lines():
            if line:
                data = json.loads(line)
                if 'response' in data:
                    print(data['response'], end='', flush=True)
                if data.get('done', False):
                    break

# Usage
stream_ollama("Write a short story about a robot")
```

**Node.js:**
```javascript
// Using fetch (Node 18+)
async function chatWithOllama(prompt, model = 'llama3.1') {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model,
      prompt: prompt,
      stream: false
    })
  });
  
  const data = await response.json();
  return data.response;
}

// Usage
chatWithOllama('Explain async/await').then(console.log);
```

**Streaming in Node.js:**
```javascript
async function streamOllama(prompt, model = 'llama3.1') {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model,
      prompt: prompt,
      stream: true
    })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(Boolean);
    
    for (const line of lines) {
      const data = JSON.parse(line);
      if (data.response) {
        process.stdout.write(data.response);
      }
    }
  }
}

// Usage
streamOllama('Write a function to reverse a string');
```

**React/Next.js:**
```javascript
import { useState } from 'react';

export default function ChatComponent() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const chat = async () => {
    setLoading(true);
    setResponse('');

    const res = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.1',
        prompt: prompt,
        stream: true
      })
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(Boolean);

      for (const line of lines) {
        const data = JSON.parse(line);
        if (data.response) {
          setResponse(prev => prev + data.response);
        }
      }
    }

    setLoading(false);
  };

  return (
    <div className="p-4">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="w-full p-2 border rounded"
        placeholder="Ask anything..."
      />
      <button 
        onClick={chat} 
        disabled={loading}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
      >
        {loading ? 'Thinking...' : 'Send'}
      </button>
      <div className="mt-4 p-4 bg-gray-100 rounded whitespace-pre-wrap">
        {response}
      </div>
    </div>
  );
}
```

### Advanced Ollama Configuration

**Custom model parameters:**
```bash
# Create a Modelfile
cat > Modelfile << EOF
FROM llama3.1

# Set temperature (creativity)
PARAMETER temperature 0.8

# Set context window
PARAMETER num_ctx 4096

# Set top_p (nucleus sampling)
PARAMETER top_p 0.9

# System prompt
SYSTEM You are a helpful coding assistant specializing in Python.
EOF

# Create custom model
ollama create my-coding-assistant -f Modelfile

# Use it
ollama run my-coding-assistant
```

**Model quantization levels:**
```bash
# Different quantization options (smaller = faster, less accurate)
ollama pull llama3.1:7b-q4_0    # 4-bit (smallest)
ollama pull llama3.1:7b-q5_0    # 5-bit
ollama pull llama3.1:7b-q8_0    # 8-bit (good balance)
ollama pull llama3.1:7b-fp16    # 16-bit (largest, most accurate)
```

### Running as a Service

**Linux (systemd):**
```bash
# Create service file
sudo cat > /etc/systemd/system/ollama.service << EOF
[Unit]
Description=Ollama Service
After=network-online.target

[Service]
ExecStart=/usr/local/bin/ollama serve
User=ollama
Group=ollama
Restart=always
RestartSec=3

[Install]
WantedBy=default.target
EOF

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable ollama
sudo systemctl start ollama
```

**macOS (LaunchAgent):**
```bash
# Create plist file
cat > ~/Library/LaunchAgents/com.ollama.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.ollama</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/ollama</string>
        <string>serve</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
EOF

# Load service
launchctl load ~/Library/LaunchAgents/com.ollama.plist
```

---

## Option 2: LM Studio (Best for Non-Technical Users)

### Installation

1. Download from [lmstudio.ai](https://lmstudio.ai/)
2. Install the application
3. Launch LM Studio

### Using LM Studio

**Step 1: Download a model**
- Click "Search" tab
- Browse or search for models (e.g., "llama-3.1-8b")
- Click download button
- Wait for download to complete

**Step 2: Load model**
- Go to "Chat" tab
- Select model from dropdown
- Adjust settings (temperature, context length)

**Step 3: Start local server**
- Click "Local Server" tab
- Click "Start Server"
- Server runs on `http://localhost:1234`

**Step 4: Use the API**

Same as OpenAI API format:

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:1234/v1",
    api_key="lm-studio"  # Can be anything
)

response = client.chat.completions.create(
    model="local-model",  # Model name doesn't matter
    messages=[
        {"role": "user", "content": "What is TypeScript?"}
    ]
)

print(response.choices[0].message.content)
```

**JavaScript/TypeScript:**
```typescript
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'http://localhost:1234/v1',
  apiKey: 'lm-studio'
});

async function chat(message: string) {
  const completion = await client.chat.completions.create({
    model: 'local-model',
    messages: [{ role: 'user', content: message }],
    stream: true
  });

  for await (const chunk of completion) {
    process.stdout.write(chunk.choices[0]?.delta?.content || '');
  }
}

chat('Explain promises in JavaScript');
```

---

## Option 3: GPT4All

**Installation:**
```bash
# Download from gpt4all.io
# Or use Python
pip install gpt4all
```

**Python usage:**
```python
from gpt4all import GPT4All

# Initialize model (auto-downloads if needed)
model = GPT4All("orca-mini-3b-gguf2-q4_0.gguf")

# Generate text
response = model.generate("What is machine learning?", max_tokens=200)
print(response)

# Chat session
with model.chat_session():
    response1 = model.generate("Hello! What is your name?")
    response2 = model.generate("What can you help me with?")
    print(response1)
    print(response2)
```

---

## Option 4: llama.cpp (Advanced/Custom Builds)

**Installation:**
```bash
# Clone repository
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp

# Build
make

# Or with CUDA support
make LLAMA_CUDA=1

# Or with Metal (Mac)
make LLAMA_METAL=1
```

**Download and convert models:**
```bash
# Download a model from Hugging Face
git clone https://huggingface.co/meta-llama/Llama-2-7b-hf

# Convert to GGUF format
python3 convert.py ./Llama-2-7b-hf

# Quantize (optional, makes smaller)
./quantize ./Llama-2-7b-hf/ggml-model-f16.gguf ./Llama-2-7b-hf/ggml-model-q4_0.gguf q4_0
```

**Run inference:**
```bash
./main -m ./models/llama-2-7b-q4_0.gguf -p "Why is the ocean salty?" -n 256
```

**Run as server:**
```bash
./server -m ./models/llama-2-7b-q4_0.gguf --host 0.0.0.0 --port 8080

# Use with cURL
curl http://localhost:8080/completion -H "Content-Type: application/json" -d '{
  "prompt": "Building a website is ",
  "n_predict": 128
}'
```

---

## Option 5: Jan (Desktop App Alternative)

1. Download from [jan.ai](https://jan.ai/)
2. Install and launch
3. Download models from the Hub
4. Chat interface + local API server
5. OpenAI-compatible API on `http://localhost:1337`

---

## Docker Deployments

**Ollama in Docker:**
```yaml
# docker-compose.yml
version: '3'
services:
  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama-data:/root/.ollama
    environment:
      - OLLAMA_HOST=0.0.0.0
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]

volumes:
  ollama-data:
```

```bash
# Start
docker-compose up -d

# Pull model
docker exec -it ollama-ollama-1 ollama pull llama3.1

# Run model
docker exec -it ollama-ollama-1 ollama run llama3.1
```

**LM Studio alternative - Text Generation WebUI:**
```bash
docker run -d \
  --name textgen \
  -p 7860:7860 \
  -v $(pwd)/models:/app/models \
  --gpus all \
  ghcr.io/oobabooga/text-generation-webui:latest
```

---

## Privacy & Security Best Practices

### 1. Network Isolation

**Restrict to localhost only:**
```bash
# Ollama - edit service or use env var
export OLLAMA_HOST=127.0.0.1:11434
ollama serve
```

**Firewall rules:**
```bash
# Linux (iptables)
sudo iptables -A INPUT -p tcp --dport 11434 -s 127.0.0.1 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 11434 -j DROP

# macOS (pf)
# Add to /etc/pf.conf:
# block in proto tcp from any to any port 11434
```

### 2. Ensure Data Stays Local

**Verify no telemetry:**
```bash
# Monitor network connections
sudo netstat -an | grep 11434
sudo tcpdump -i any port 11434

# Ollama doesn't send telemetry, but verify with:
sudo lsof -i -P | grep ollama
```

**Disable model auto-updates:**
```bash
# Ollama automatically checks for updates
# Disable by blocking in firewall or use offline mode
export OLLAMA_SKIP_UPDATE_CHECK=1
```

### 3. Encrypted Storage

```bash
# Store models on encrypted volume
# macOS
diskutil apfs addVolume disk1 APFS "Encrypted Models" -encryption

# Linux (LUKS)
sudo cryptsetup luksFormat /dev/sdX
sudo cryptsetup open /dev/sdX encrypted_models
sudo mkfs.ext4 /dev/mapper/encrypted_models
```

### 4. Audit Logs

```bash
# Enable Ollama logging
export OLLAMA_DEBUG=1
ollama serve > ollama.log 2>&1

# Monitor API calls
tail -f ollama.log | grep "POST /api"
```

### 5. Sandboxing

**Run in Docker (isolated):**
```bash
docker run -d \
  --name ollama \
  --network none \
  -v ollama-data:/root/.ollama \
  ollama/ollama
```

**Run with limited permissions:**
```bash
# Create dedicated user
sudo useradd -r -s /bin/false ollama-user

# Run as that user
sudo -u ollama-user ollama serve
```

---

## Performance Optimization

### GPU Acceleration

**NVIDIA (CUDA):**
```bash
# Verify CUDA
nvidia-smi

# Ollama automatically uses GPU if available
# Check with:
ollama ps

# Force GPU usage
export OLLAMA_NUM_GPU=1
```

**AMD (ROCm):**
```bash
# Install ROCm
# Ollama supports AMD GPUs with ROCm 5.7+

# Verify
rocm-smi

# Set device
export HSA_OVERRIDE_GFX_VERSION=10.3.0
```

**Apple Silicon (Metal):**
```bash
# Ollama automatically uses Metal
# Verify in Activity Monitor (GPU usage)

# Ollama settings
export OLLAMA_METAL=1
```

### Memory Management

**Adjust context size:**
```bash
ollama run llama3.1 --num-ctx 2048  # Smaller context, less memory
```

**Reduce concurrent requests:**
```bash
export OLLAMA_MAX_LOADED_MODELS=1
export OLLAMA_NUM_PARALLEL=1
```

**Use quantized models:**
```bash
# 4-bit uses ~4GB RAM for 7B model
ollama pull llama3.1:7b-q4_0

# 8-bit uses ~8GB RAM for 7B model
ollama pull llama3.1:7b-q8_0
```

### CPU Optimization

```bash
# Set thread count
export OLLAMA_NUM_THREADS=8

# For CPU-only inference
export OLLAMA_NUM_GPU=0
```

---

## Model Recommendations by Use Case

### General Chat (Balanced)
- **Llama 3.1 8B** - Best overall
- **Mistral 7B** - Fast and capable
- **Gemma 2 9B** - Google quality

### Coding
- **DeepSeek Coder 6.7B** - Best for code
- **Code Llama 7B** - Meta's coder
- **Qwen 2.5 Coder 7B** - Multilingual code

### Creative Writing
- **Llama 3.1 8B** - Great storyteller
- **Mistral 7B** - Creative outputs
- **Llama 3.3 70B** - Best quality (needs 48GB+ RAM)

### Speed Priority
- **Phi-3 3.8B** - Tiny but smart
- **TinyLlama 1.1B** - Ultra-fast
- **Gemma 2B** - Small and capable

### Privacy-Critical Tasks
- **Llama 3.1 8B** - Open weights, auditable
- **Mistral 7B** - EU-based, privacy-focused
- **Qwen 2.5** - Strong Chinese support

---

## Troubleshooting

### Ollama won't start
```bash
# Check if already running
ps aux | grep ollama

# Kill existing process
killall ollama

# Check logs
journalctl -u ollama -n 50

# Reset Ollama
rm -rf ~/.ollama
```

### Out of memory errors
```bash
# Use smaller quantization
ollama pull llama3.1:7b-q4_0

# Reduce context
ollama run llama3.1 --num-ctx 1024

# Close other applications
# Upgrade RAM or use smaller model
```

### Slow inference
```bash
# Check GPU usage
nvidia-smi  # NVIDIA
rocm-smi    # AMD

# Verify GPU is being used
ollama ps

# Enable GPU if not active
export OLLAMA_NUM_GPU=1

# Use quantized model
ollama pull llama3.1:7b-q4_0
```

### Connection refused
```bash
# Check if server is running
curl http://localhost:11434

# Start server
ollama serve

# Check port
sudo lsof -i :11434
```

### Model download fails
```bash
# Check disk space
df -h

# Check internet connection
ping ollama.com

# Try different mirror
export OLLAMA_MODELS=/path/to/models
```

---

## Cost Analysis

### Cloud API Costs (GPT-4)
- $30 per 1M input tokens
- $60 per 1M output tokens
- 100k tokens/day = ~$2,700/month

### Local Hardware Investment

**Budget Setup ($500-1000):**
- Used workstation with 16GB RAM
- NVIDIA RTX 3060 12GB
- Runs 7B-13B models well
- **Payback:** ~2-4 weeks vs GPT-4 API

**Mid-Range ($1500-3000):**
- 32GB RAM + RTX 4070 Ti
- Runs 13B-34B models smoothly
- **Payback:** ~1-2 months vs GPT-4 API

**High-End ($5000+):**
- 64GB+ RAM + RTX 4090/A6000
- Runs 70B models efficiently
- **Payback:** ~2-3 months for heavy usage

---

## Comparison Table

| Feature | Ollama | LM Studio | GPT4All | llama.cpp |
|---------|--------|-----------|---------|-----------|
| Ease of use | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| API support | ✅ | ✅ | ✅ | ✅ |
| GUI | ❌ | ✅ | ✅ | ❌ |
| Performance | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Model library | Large | Large | Medium | DIY |
| Cross-platform | ✅ | ✅ | ✅ | ✅ |
| GPU support | ✅ | ✅ | ✅ | ✅ |
| Open source | ✅ | ❌ | ✅ | ✅ |

---

## Resources

- [Ollama Documentation](https://github.com/ollama/ollama/tree/main/docs)
- [LM Studio Docs](https://lmstudio.ai/docs)
- [GPT4All GitHub](https://github.com/nomic-ai/gpt4all)
- [llama.cpp GitHub](https://github.com/ggerganov/llama.cpp)
- [Hugging Face Models](https://huggingface.co/models)
- [Model benchmarks](https://huggingface.co/spaces/lmsys/chatbot-arena-leaderboard)
- [Quantization guide](https://huggingface.co/docs/optimum/concept_guides/quantization)