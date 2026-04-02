const fs = require('fs')
const path = require('path')

const projectRoot = process.cwd()
const templatePath = path.join(projectRoot, 'public', 'api', 'helena', 'sessions.php')
const distPath = path.join(projectRoot, 'dist', 'api', 'helena', 'sessions.php')

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {}
  }

  const content = fs.readFileSync(filePath, 'utf8')

  return content.split(/\r?\n/).reduce((acc, line) => {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#')) {
      return acc
    }

    const separatorIndex = trimmed.indexOf('=')

    if (separatorIndex === -1) {
      return acc
    }

    const key = trimmed.slice(0, separatorIndex).trim()
    const value = trimmed.slice(separatorIndex + 1).trim()
    acc[key] = value
    return acc
  }, {})
}

function resolveBuildEnv() {
  const fileEnv = {
    ...readEnvFile(path.join(projectRoot, '.env')),
    ...readEnvFile(path.join(projectRoot, '.env.local')),
  }

  return {
    HELENA_API_BASE_URL:
      process.env.HELENA_API_BASE_URL ||
      fileEnv.HELENA_API_BASE_URL ||
      'https://api.helena.run',
    HELENA_API_TOKEN:
      process.env.HELENA_API_TOKEN ||
      fileEnv.HELENA_API_TOKEN ||
      '',
  }
}

function ensureDirectory(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
}

function main() {
  if (!fs.existsSync(templatePath)) {
    throw new Error('Template do proxy PHP nao encontrado em public/api/helena/sessions.php')
  }

  const env = resolveBuildEnv()
  const template = fs.readFileSync(templatePath, 'utf8')
  const rendered = template
    .replaceAll('__HELENA_API_BASE_URL__', env.HELENA_API_BASE_URL)
    .replaceAll('__HELENA_API_TOKEN__', env.HELENA_API_TOKEN)

  ensureDirectory(distPath)
  fs.writeFileSync(distPath, rendered, 'utf8')

  const tokenState = env.HELENA_API_TOKEN ? 'token embutido' : 'sem token embutido'
  console.log(`[php-proxy] dist/api/helena/sessions.php gerado (${tokenState})`)
}

main()
