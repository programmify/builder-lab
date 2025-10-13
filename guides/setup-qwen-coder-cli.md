# Setup QWEN Coder CLI in VS Code

**QWEN Coder CLI is completely FREE to use!** 🎉 This powerful AI coding assistant can help you write, debug, and understand code directly from your terminal. Follow this step-by-step guide to get it set up in VS Code.

## What is QWEN Coder CLI?

QWEN Coder CLI is an AI-powered coding agent that lives in your terminal. It can:
- 🔍 **Analyze codebases** and explain architecture
- 💻 **Generate code** for any programming language
- 🐛 **Debug issues** and suggest fixes
- 📚 **Understand new codebases** quickly
- 🔄 **Refactor code** and improve performance
- 📝 **Generate documentation** and tests

## Prerequisites

Before we start, make sure you have:
- **VS Code** installed (download from [code.visualstudio.com](https://code.visualstudio.com))
- **Node.js** (version 18 or higher) - [Download here](https://nodejs.org)
- **Git** installed - [Download here](https://git-scm.com)

## Step 1: Download and Install VS Code

1. **Download VS Code**
   - Go to [code.visualstudio.com](https://code.visualstudio.com)
   - Click "Download for Windows" (or your operating system)
   - Run the installer and follow the setup wizard

2. **Open VS Code**
   - Launch VS Code from your desktop or start menu
   - You'll see the welcome screen

## Step 2: Open Terminal in VS Code

1. **Open the Terminal**
   - Press `Ctrl + `` (backtick) or go to `View > Terminal`
   - The terminal will appear at the bottom of VS Code
   - Make sure you're in your project directory

2. **Verify Node.js Installation**
   ```bash
   node --version
   npm --version
   ```
   You should see version numbers (Node.js 18+ and npm 8+)

## Step 3: Install QWEN Coder CLI

1. **Install QWEN Coder CLI globally**
   ```bash
   npm install -g @qwen-code/qwen-code@latest
   ```

2. **Verify Installation**
   ```bash
   qwen --version
   ```
   You should see the version number (e.g., v0.0.15)

## Step 4: Authentication Setup

QWEN Coder CLI offers **FREE authentication** with generous quotas! Choose your preferred method:

### Option 1: QWEN OAuth (🚀 Recommended - Completely FREE!)

This is the easiest way to get started:

1. **Run the authentication command**
   ```bash
   qwen
   ```

2. **Follow the browser authentication**
   - CLI will automatically open your browser
   - Sign in with your qwen.ai account (create one if needed)
   - Grant permissions when prompted
   - You'll be redirected back to the terminal

**Free Tier Benefits:**
- ✅ **2,000 requests/day** (no token counting needed)
- ✅ **60 requests/minute** rate limit
- ✅ **Automatic credential refresh**
- ✅ **Zero cost** for individual users

### Option 2: API Key Authentication (Alternative)

If you prefer using API keys:

1. **Set up environment variables**
   ```bash
   # Create a .env file in your project
   echo "OPENAI_API_KEY=your_api_key_here" > .env
   echo "OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1" >> .env
   echo "OPENAI_MODEL=qwen3-coder-plus" >> .env
   ```

2. **Or set system environment variables**
   - Windows: Set in System Properties > Environment Variables
   - Mac/Linux: Add to your `~/.bashrc` or `~/.zshrc`

## Step 5: Test Your Setup

1. **Start QWEN Coder CLI**
   ```bash
   qwen
   ```

2. **Try a simple command**
   ```
   > Hello! Can you help me understand this codebase?
   ```

3. **Test code analysis**
   ```
   > What are the main components of this project?
   ```

## Step 6: VS Code Integration Tips

### Terminal Configuration

1. **Set up your preferred terminal**
   - Go to `File > Preferences > Settings`
   - Search for "terminal.integrated.defaultProfile.windows"
   - Choose your preferred shell (PowerShell, Command Prompt, or Git Bash)

2. **Enable terminal shortcuts**
   - `Ctrl + `` - Toggle terminal
   - `Ctrl + Shift + `` - New terminal
   - `Ctrl + C` - Cancel current operation

### Useful VS Code Extensions

Install these extensions for better integration:

1. **Terminal Extensions**
   - **Terminal** - Built-in terminal support
   - **PowerShell** - Enhanced PowerShell support

2. **Code Quality Extensions**
   - **ESLint** - JavaScript/TypeScript linting
   - **Prettier** - Code formatting
   - **GitLens** - Enhanced Git capabilities

## Step 7: Basic Usage Examples

### 🔍 Explore Your Codebase

```bash
# Navigate to your project
cd your-project-directory

# Start QWEN Coder CLI
qwen

# Ask questions about your code
> Describe the main architecture of this project
> What are the key dependencies?
> Find all API endpoints and their authentication methods
```

### 💻 Code Development

```bash
# Code generation
> Create a REST API endpoint for user management
> Generate unit tests for the authentication module
> Add error handling to all database operations

# Code refactoring
> Refactor this function to improve readability
> Convert this class to use dependency injection
> Split this large module into smaller components
```

### 🐛 Debugging & Analysis

```bash
# Performance analysis
> Identify performance bottlenecks in this React component
> Find all N+1 query problems in the codebase

# Security audit
> Check for potential SQL injection vulnerabilities
> Find all hardcoded credentials or API keys
```

## Step 8: Advanced Configuration

### Custom Settings

Create a `.qwen/settings.json` file in your home directory:

```json
{
  "experimental": {
    "vlmSwitchMode": "once",
    "visionModelPreview": true
  }
}
```

### Session Commands

While using QWEN Coder CLI, you can use these commands:

- `/help` - Display available commands
- `/clear` - Clear conversation history
- `/compress` - Compress history to save tokens
- `/stats` - Show current session information
- `/exit` or `/quit` - Exit QWEN Coder CLI

## Troubleshooting

### Common Issues

1. **"qwen: command not found"**
   ```bash
   # Reinstall globally
   npm uninstall -g @qwenlm/qwen-code
   npm install -g @qwenlm/qwen-code
   ```

2. **Authentication errors**
   ```bash
   # Clear cached credentials
   qwen --logout
   qwen  # Re-authenticate
   ```

3. **Permission errors on Windows**
   ```bash
   # Run VS Code as Administrator
   # Or use PowerShell as Administrator
   ```

4. **Node.js version issues**
   ```bash
   # Update Node.js to version 18+
   # Or use nvm to manage versions
   nvm install 18
   nvm use 18
   ```

### Getting Help

- **Documentation**: [qwenlm.github.io/qwen-code-docs](https://qwenlm.github.io/qwen-code-docs)
- **GitHub Repository**: [github.com/QwenLM/qwen-code](https://github.com/QwenLM/qwen-code)
- **Issues**: Report bugs on GitHub Issues

## Best Practices

### 1. Project Organization
- Always run `qwen` from your project root directory
- Keep your codebase organized with clear folder structure
- Use meaningful commit messages for better analysis

### 2. Effective Prompts
- Be specific about what you want to achieve
- Provide context about your project
- Ask follow-up questions for clarification

### 3. Security
- Never share your API keys
- Use environment variables for sensitive data
- Review generated code before using in production

### 4. Performance
- Use `/compress` to save tokens in long sessions
- Break down complex tasks into smaller steps
- Use `/clear` to start fresh when needed

## Next Steps

Now that you have QWEN Coder CLI set up, try these activities:

1. **Explore a new codebase**
   ```bash
   > What are the core business logic components?
   > How does the data flow through the system?
   > What security mechanisms are in place?
   ```

2. **Refactor existing code**
   ```bash
   > Help me refactor this class to follow SOLID principles
   > Add proper error handling and logging
   > Convert callbacks to async/await pattern
   ```

3. **Generate documentation**
   ```bash
   > Generate comprehensive JSDoc comments for all public APIs
   > Create API documentation in OpenAPI format
   > Generate a README for this module
   ```

4. **Set up new projects**
   ```bash
   > Set up a new Express server with authentication
   > Create a React component with TypeScript and tests
   > Implement a rate limiter middleware
   ```

## Conclusion

Congratulations! 🎉 You now have QWEN Coder CLI set up and ready to use. This powerful AI coding assistant will help you:

- **Understand codebases** faster
- **Generate code** more efficiently
- **Debug issues** more effectively
- **Learn new technologies** through hands-on assistance

Remember: QWEN Coder CLI is completely **FREE** to use with generous quotas, so don't hesitate to experiment and explore its capabilities!

---

**Happy Coding!** 🚀

*Need help? Check out the [official documentation](https://qwenlm.github.io/qwen-code-docs) or join the [GitHub discussions](https://github.com/QwenLM/qwen-code/discussions).*
