import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'
import '@fontsource/jetbrains-mono/latin-400.css'
import '@fontsource/jetbrains-mono/latin-500.css'
import './index.css'
import './jornada/layout-certsim.css'
import App from './App.tsx'
import { obterArmazemAparencia } from './tema/armazemAparencia'

// Cria o armazem antes do primeiro render: ele so le o que o script inicial deixou no html.
obterArmazemAparencia()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
