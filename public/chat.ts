// Docente IA - Cliente TypeScript
// Interfaz web para interactuar con el sistema multiagente

interface SessionResponse {
    sessionId: string;
}

interface EventResponse {
    turns: Turn[];
    currentStep?: string;
    completed?: boolean;
}

interface Turn {
    stepId: string;
    role: "tutor" | "student" | "verifier" | "help" | "system" | "socratic";
    text: string;
    score?: number;
    findings?: string[];
}

interface SessionState {
    sessionId: string;
    lessonId: string;
    userId: string;
    currentStep: string;
    turns: Turn[];
    completed: boolean;
}

class DocenteIAChat {
    private sessionId: string | null = null;
    private currentStep: string | null = null;
    private isProcessing: boolean = false;
    
    // DOM Elements
    private lessonSelect: HTMLSelectElement;
    private startSessionBtn: HTMLButtonElement;
    private messagesContainer: HTMLElement;
    private messageInput: HTMLInputElement;
    private sendMessageBtn: HTMLButtonElement;
    private sessionStatus: HTMLElement;
    private agentIndicator: HTMLElement;
    private stepIndicator: HTMLElement;
    private sessionIdDisplay: HTMLElement;
    private currentStepDisplay: HTMLElement;
    private progressDisplay: HTMLElement;
    private scoreDisplay: HTMLElement;
    private helpBtn: HTMLButtonElement;
    private resetBtn: HTMLButtonElement;
    private typingIndicator: HTMLElement;
    private inputHint: HTMLElement;
    private lessonInfo: HTMLElement;

    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.updateLessonInfo();
    }

    private initializeElements(): void {
        this.lessonSelect = document.getElementById('lessonSelect') as HTMLSelectElement;
        this.startSessionBtn = document.getElementById('startSession') as HTMLButtonElement;
        this.messagesContainer = document.getElementById('messagesContainer') as HTMLElement;
        this.messageInput = document.getElementById('messageInput') as HTMLInputElement;
        this.sendMessageBtn = document.getElementById('sendMessage') as HTMLButtonElement;
        this.sessionStatus = document.getElementById('sessionStatus') as HTMLElement;
        this.agentIndicator = document.getElementById('agentIndicator') as HTMLElement;
        this.stepIndicator = document.getElementById('stepIndicator') as HTMLElement;
        this.sessionIdDisplay = document.getElementById('sessionIdDisplay') as HTMLElement;
        this.currentStepDisplay = document.getElementById('currentStepDisplay') as HTMLElement;
        this.progressDisplay = document.getElementById('progressDisplay') as HTMLElement;
        this.scoreDisplay = document.getElementById('scoreDisplay') as HTMLElement;
        this.helpBtn = document.getElementById('helpBtn') as HTMLButtonElement;
        this.resetBtn = document.getElementById('resetBtn') as HTMLButtonElement;
        this.typingIndicator = document.getElementById('typingIndicator') as HTMLElement;
        this.inputHint = document.getElementById('inputHint') as HTMLElement;
        this.lessonInfo = document.getElementById('lessonInfo') as HTMLElement;
    }

    private bindEvents(): void {
        this.startSessionBtn.addEventListener('click', () => this.startSession());
        this.sendMessageBtn.addEventListener('click', () => this.sendMessage());
        this.helpBtn.addEventListener('click', () => this.requestHelp());
        this.resetBtn.addEventListener('click', () => this.resetSession());
        this.lessonSelect.addEventListener('change', () => this.updateLessonInfo());
        
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
    }

    private updateLessonInfo(): void {
        const selectedLesson = this.lessonSelect.value;
        if (selectedLesson === 'mineria/iperc/lesson01') {
            this.lessonInfo.textContent = 'Lección sobre Identificación de Peligros y Evaluación de Riesgos y Controles (IPERC)';
        } else {
            this.lessonInfo.textContent = 'Selecciona una lección para ver los detalles';
        }
    }

    private async startSession(): Promise<void> {
        const lessonId = this.lessonSelect.value;
        if (!lessonId) {
            this.showError('Por favor selecciona una lección');
            return;
        }

        this.setLoading(true);
        this.startSessionBtn.disabled = true;

        try {
            const response = await fetch('/chat/session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    lessonId: lessonId,
                    userId: 'web-user-' + Date.now()
                })
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data: SessionResponse = await response.json();
            this.sessionId = data.sessionId;
            
            this.updateSessionUI();
            this.clearMessages();
            this.addMessage('system', '✅ Sesión iniciada correctamente. El tutor comenzará la lección en breve...');
            
            // Obtener el estado inicial de la sesión
            await this.refreshSessionState();
            
        } catch (error) {
            console.error('Error starting session:', error);
            this.showError('Error al iniciar la sesión: ' + (error as Error).message);
        } finally {
            this.setLoading(false);
            this.startSessionBtn.disabled = false;
        }
    }

    private async sendMessage(): Promise<void> {
        const text = this.messageInput.value.trim();
        if (!text || !this.sessionId || this.isProcessing) return;

        this.setProcessing(true);
        this.messageInput.value = '';
        
        // Mostrar mensaje del usuario
        this.addMessage('student', text);

        try {
            const response = await fetch('/chat/event', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sessionId: this.sessionId,
                    event: {
                        type: 'answer',
                        text: text
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data: EventResponse = await response.json();
            this.processTurns(data.turns);
            
            if (data.currentStep) {
                this.currentStep = data.currentStep;
                this.updateStepIndicator();
            }

            if (data.completed) {
                this.handleSessionCompleted();
            }

        } catch (error) {
            console.error('Error sending message:', error);
            this.showError('Error al enviar mensaje: ' + (error as Error).message);
        } finally {
            this.setProcessing(false);
        }
    }

    private async requestHelp(): Promise<void> {
        if (!this.sessionId || this.isProcessing) return;

        this.setProcessing(true);
        this.addMessage('student', '💡 Solicitud de ayuda');

        try {
            const response = await fetch('/chat/event', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sessionId: this.sessionId,
                    event: {
                        type: 'help',
                        text: 'Necesito ayuda con esta lección'
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data: EventResponse = await response.json();
            this.processTurns(data.turns);

        } catch (error) {
            console.error('Error requesting help:', error);
            this.showError('Error al solicitar ayuda: ' + (error as Error).message);
        } finally {
            this.setProcessing(false);
        }
    }

    private async refreshSessionState(): Promise<void> {
        if (!this.sessionId) return;

        try {
            const response = await fetch(`/chat/session/${this.sessionId}`);
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data: SessionState = await response.json();
            
            // Mostrar todos los turnos existentes
            this.processTurns(data.turns);
            
            this.currentStep = data.currentStep;
            this.updateStepIndicator();
            
            if (data.completed) {
                this.handleSessionCompleted();
            }

        } catch (error) {
            console.error('Error refreshing session state:', error);
            this.showError('Error al actualizar el estado de la sesión');
        }
    }

    private processTurns(turns: Turn[]): void {
        turns.forEach(turn => {
            if (turn.role !== 'student') {
                this.addMessage(turn.role, turn.text, turn.score, turn.findings);
                this.updateAgentStatus(turn.role, 'active');
                
                // Resetear estado después de un tiempo
                setTimeout(() => {
                    this.updateAgentStatus(turn.role, 'inactive');
                }, 2000);
            }
        });
    }

    private addMessage(role: string, text: string, score?: number, findings?: string[]): void {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message-bubble';
        
        const isUser = role === 'student';
        const messageClass = isUser ? 'message-user' : 'message-ai';
        
        let roleIcon = this.getRoleIcon(role);
        let roleName = this.getRoleName(role);
        
        let scoreHtml = '';
        if (score !== undefined) {
            const scoreColor = score >= 80 ? 'text-success' : score >= 60 ? 'text-yellow-600' : 'text-destructive';
            scoreHtml = `<div class="mt-2 text-sm ${scoreColor} font-medium">Puntuación: ${score}/100</div>`;
        }
        
        let findingsHtml = '';
        if (findings && findings.length > 0) {
            findingsHtml = `
                <div class="mt-2 text-sm">
                    <div class="font-medium mb-1">Observaciones:</div>
                    <ul class="list-disc list-inside space-y-1">
                        ${findings.map(finding => `<li>${finding}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        messageDiv.innerHTML = `
            <div class="flex ${isUser ? 'justify-end' : 'justify-start'}">
                <div class="max-w-xs lg:max-w-md xl:max-w-lg p-4 rounded-lg ${messageClass}">
                    ${!isUser ? `<div class="flex items-center gap-2 mb-2 text-sm font-medium">
                        <span>${roleIcon}</span>
                        <span>${roleName}</span>
                    </div>` : ''}
                    <div class="text-sm leading-relaxed">${text}</div>
                    ${scoreHtml}
                    ${findingsHtml}
                </div>
            </div>
        `;

        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    private getRoleIcon(role: string): string {
        const icons: { [key: string]: string } = {
            'tutor': '👨‍🏫',
            'verifier': '✅',
            'socratic': '🤔',
            'help': '💡',
            'system': '🤖',
            'student': '👤'
        };
        return icons[role] || '🤖';
    }

    private getRoleName(role: string): string {
        const names: { [key: string]: string } = {
            'tutor': 'Tutor',
            'verifier': 'Evaluador',
            'socratic': 'Coach Socrático',
            'help': 'Mesa de Ayuda',
            'system': 'Sistema',
            'student': 'Estudiante'
        };
        return names[role] || 'Sistema';
    }

    private updateAgentStatus(agent: string, status: 'active' | 'inactive'): void {
        const agentMap: { [key: string]: string } = {
            'tutor': 'tutorStatus',
            'verifier': 'verifierStatus',
            'socratic': 'socraticStatus',
            'help': 'helpdeskStatus'
        };

        const elementId = agentMap[agent];
        if (elementId) {
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = status === 'active' ? 'Activo' : 'Inactivo';
                element.className = `agent-badge px-2 py-1 rounded text-xs font-medium ${
                    status === 'active' ? 'active' : 'bg-muted text-muted-foreground'
                }`;
            }
        }

        // Actualizar indicador principal
        if (status === 'active') {
            this.agentIndicator.textContent = this.getRoleName(agent);
            this.agentIndicator.className = 'px-3 py-1 rounded-full text-xs font-medium active';
        }
    }

    private updateStepIndicator(): void {
        if (this.currentStep) {
            this.stepIndicator.textContent = this.currentStep;
            this.currentStepDisplay.textContent = this.currentStep;
        }
    }

    private updateSessionUI(): void {
        if (this.sessionId) {
            this.sessionStatus.textContent = 'Sesión activa';
            this.sessionIdDisplay.textContent = this.sessionId.substring(0, 8) + '...';
            this.messageInput.disabled = false;
            this.sendMessageBtn.disabled = false;
            this.helpBtn.disabled = false;
            this.resetBtn.disabled = false;
            this.inputHint.textContent = 'Escribe tu respuesta o pregunta...';
            this.startSessionBtn.textContent = 'Nueva Sesión';
        }
    }

    private handleSessionCompleted(): void {
        this.addMessage('system', '🎉 ¡Felicitaciones! Has completado la lección exitosamente.');
        this.messageInput.disabled = true;
        this.sendMessageBtn.disabled = true;
        this.inputHint.textContent = 'Lección completada';
    }

    private resetSession(): void {
        this.sessionId = null;
        this.currentStep = null;
        this.sessionStatus.textContent = 'No hay sesión activa';
        this.sessionIdDisplay.textContent = '-';
        this.currentStepDisplay.textContent = '-';
        this.progressDisplay.textContent = '0/0';
        this.scoreDisplay.textContent = '-';
        this.messageInput.disabled = true;
        this.sendMessageBtn.disabled = true;
        this.helpBtn.disabled = true;
        this.resetBtn.disabled = true;
        this.inputHint.textContent = 'Inicia una sesión para comenzar a chatear';
        this.startSessionBtn.textContent = 'Iniciar Sesión';
        this.agentIndicator.textContent = 'Sistema';
        this.stepIndicator.textContent = 'Esperando...';
        this.clearMessages();
        
        // Resetear estados de agentes
        ['plannerStatus', 'tutorStatus', 'verifierStatus', 'socraticStatus', 'helpdeskStatus'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = 'Inactivo';
                element.className = 'agent-badge px-2 py-1 rounded text-xs font-medium bg-muted text-muted-foreground';
            }
        });
    }

    private clearMessages(): void {
        this.messagesContainer.innerHTML = '';
    }

    private setLoading(loading: boolean): void {
        if (loading) {
            this.startSessionBtn.textContent = 'Iniciando...';
            this.startSessionBtn.disabled = true;
        } else {
            this.startSessionBtn.textContent = this.sessionId ? 'Nueva Sesión' : 'Iniciar Sesión';
            this.startSessionBtn.disabled = false;
        }
    }

    private setProcessing(processing: boolean): void {
        this.isProcessing = processing;
        this.messageInput.disabled = processing || !this.sessionId;
        this.sendMessageBtn.disabled = processing || !this.sessionId;
        
        if (processing) {
            this.typingIndicator.classList.remove('hidden');
            this.inputHint.textContent = 'El tutor está procesando tu respuesta...';
        } else {
            this.typingIndicator.classList.add('hidden');
            this.inputHint.textContent = 'Escribe tu respuesta o pregunta...';
        }
    }

    private showError(message: string): void {
        this.addMessage('system', `❌ ${message}`);
    }

    private scrollToBottom(): void {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new DocenteIAChat();
});

// Exportar para uso en módulos
export { DocenteIAChat };
