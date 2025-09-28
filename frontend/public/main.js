// Docente IA - Cliente JavaScript
// Interfaz web para interactuar con el sistema multiagente

class DocenteIAChat {
    constructor() {
        this.sessionId = null;
        this.currentStep = null;
        this.isProcessing = false;
        this.currentStepIndex = 0;
        this.totalSteps = 0;
        this.currentLessonTitle = '';

        this.initializeElements();
        this.bindEvents();
        this.updateLessonInfo();
    }

    initializeElements() {
        this.lessonSelect = document.getElementById('lessonSelect');
        this.startSessionBtn = document.getElementById('startSession');
        this.messagesContainer = document.getElementById('messagesContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendMessageBtn = document.getElementById('sendMessage');
        this.sessionStatus = document.getElementById('sessionStatus');
        this.agentIndicator = document.getElementById('agentIndicator');
        this.stepIndicator = document.getElementById('stepIndicator');
        this.sessionIdDisplay = document.getElementById('sessionIdDisplay');
        this.currentStepDisplay = document.getElementById('currentStepDisplay');
        this.progressDisplay = document.getElementById('progressDisplay');
        this.scoreDisplay = document.getElementById('scoreDisplay');
        this.helpBtn = document.getElementById('helpBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.typingIndicator = document.getElementById('typingIndicator');
        this.inputHint = document.getElementById('inputHint');
        this.lessonInfo = document.getElementById('lessonInfo');
    }

    bindEvents() {
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

    updateLessonInfo() {
        const selectedLesson = this.lessonSelect.value;
        if (selectedLesson === 'mineria/iperc/lesson01') {
            this.lessonInfo.textContent = 'Lección sobre Identificación de Peligros y Evaluación de Riesgos y Controles (IPERC)';
        } else {
            this.lessonInfo.textContent = 'Selecciona una lección para ver los detalles';
        }
    }

    async startSession() {
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

            const data = await response.json();
            this.sessionId = data.sessionId;
            this.currentStepIndex = typeof data.currentStepIndex === 'number' ? data.currentStepIndex : 0;
            this.totalSteps = data.lesson?.totalSteps ?? 0;
            this.currentLessonTitle = data.lesson?.title ?? '';

            this.updateSessionUI();
            this.clearMessages(false);
            this.addMessage('system', '✅ Sesión iniciada correctamente. El tutor comenzará la lección en breve...');

            if (Array.isArray(data.initialTurns)) {
                data.initialTurns
                    .filter(turn => turn && turn.text)
                    .forEach(turn => this.addMessage(turn.role, turn.text, turn.score, turn.findings));
            }

            this.updateProgressDisplay();
            if (this.currentLessonTitle) {
                this.lessonInfo.textContent = this.currentLessonTitle;
            }

        } catch (error) {
            console.error('Error starting session:', error);
            this.showError('Error al iniciar la sesión: ' + error.message);
        } finally {
            this.setLoading(false);
            this.startSessionBtn.disabled = false;
        }
    }

    async sendMessage() {
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

            const data = await response.json();

            const replyRole = data.replyRole || 'tutor';
            this.addMessage(replyRole, data.reply);

            if (data.score !== undefined) {
                this.scoreDisplay.textContent = Math.round(data.score * 100) + '/100';
            }

            if (data.feedback) {
                this.addMessage('verifier', data.feedback, data.score);
            }

            if (Array.isArray(data.nextTurns)) {
                data.nextTurns
                    .filter(turn => turn && turn.text)
                    .forEach(turn => this.addMessage(turn.role, turn.text, turn.score, turn.findings));
            }

            if (typeof data.currentStepIndex === 'number') {
                this.currentStepIndex = data.currentStepIndex;
                this.updateProgressDisplay();
            }

            if (data.isFinished) {
                this.handleSessionCompleted();
            }

        } catch (error) {
            console.error('Error sending message:', error);
            this.showError('Error al enviar mensaje: ' + error.message);
        } finally {
            this.setProcessing(false);
        }
    }

    async requestHelp() {
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
                        type: 'question',
                        text: 'Necesito ayuda con esta lección'
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            const replyRole = data.replyRole || 'help';
            this.addMessage(replyRole, data.reply);

            if (typeof data.currentStepIndex === 'number') {
                this.currentStepIndex = data.currentStepIndex;
                this.updateProgressDisplay();
            }

        } catch (error) {
            console.error('Error requesting help:', error);
            this.showError('Error al solicitar ayuda: ' + error.message);
        } finally {
            this.setProcessing(false);
        }
    }

    async refreshSessionState() {
        if (!this.sessionId) return;

        try {
            const response = await fetch(`/chat/session/${this.sessionId}`);
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            this.clearMessages(false);

            // Mostrar historial de turnos
            if (data.history && data.history.length > 0) {
                data.history.forEach(turn => {
                    if (turn.role !== 'student') {
                        this.addMessage(turn.role, turn.text, turn.score, turn.findings);
                    }
                });
            }

            if (typeof data.currentStepIndex === 'number') {
                this.currentStepIndex = data.currentStepIndex;
            }

            if (data.lesson && typeof data.lesson.totalSteps === 'number') {
                this.totalSteps = data.lesson.totalSteps;
            }

            this.updateProgressDisplay();

            if (data.isFinished) {
                this.handleSessionCompleted();
            }

        } catch (error) {
            console.error('Error refreshing session state:', error);
            this.showError('Error al actualizar el estado de la sesión');
        }
    }

    addMessage(role, text, score, findings) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message-bubble';

        const isUser = role === 'student';
        const messageClass = isUser ? 'message-user' : 'message-ai';
        
        const roleIcon = this.getRoleIcon(role);
        const roleName = this.getRoleName(role);
        
        let scoreHtml = '';
        if (score !== undefined) {
            const scorePercent = Math.round(score * 100);
            const scoreColor = scorePercent >= 80 ? 'text-green-600' : scorePercent >= 60 ? 'text-yellow-600' : 'text-red-600';
            scoreHtml = `<div class="mt-2 text-sm ${scoreColor} font-medium">Puntuación: ${scorePercent}/100</div>`;
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
        
        // Actualizar estado del agente
        this.updateAgentStatus(role, 'active');
        setTimeout(() => {
            this.updateAgentStatus(role, 'inactive');
        }, 2000);
    }

    getRoleIcon(role) {
        const icons = {
            'tutor': '👨‍🏫',
            'verifier': '✅',
            'socratic': '🤔',
            'help': '💡',
            'planner': '🧭',
            'system': '🤖',
            'student': '👤'
        };
        return icons[role] || '🤖';
    }

    getRoleName(role) {
        const names = {
            'tutor': 'Tutor',
            'verifier': 'Evaluador',
            'socratic': 'Coach Socrático',
            'help': 'Mesa de Ayuda',
            'planner': 'Planificador',
            'system': 'Sistema',
            'student': 'Estudiante'
        };
        return names[role] || 'Sistema';
    }

    updateAgentStatus(agent, status) {
        const agentMap = {
            'tutor': 'tutorStatus',
            'verifier': 'verifierStatus',
            'socratic': 'socraticStatus',
            'help': 'helpdeskStatus',
            'planner': 'plannerStatus'
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

    updateSessionUI() {
        if (this.sessionId) {
            this.sessionStatus.textContent = 'Sesión activa';
            this.sessionIdDisplay.textContent = this.sessionId.substring(0, 8) + '...';
            this.messageInput.disabled = false;
            this.sendMessageBtn.disabled = false;
            this.helpBtn.disabled = false;
            this.resetBtn.disabled = false;
            this.inputHint.textContent = 'Escribe tu respuesta o pregunta...';
            this.startSessionBtn.textContent = 'Nueva Sesión';
            this.updateProgressDisplay();
        }
    }

    handleSessionCompleted() {
        this.addMessage('system', '🎉 ¡Felicitaciones! Has completado la lección exitosamente.');
        this.messageInput.disabled = true;
        this.sendMessageBtn.disabled = true;
        this.inputHint.textContent = 'Lección completada';
        this.currentStepIndex = this.totalSteps ? this.totalSteps - 1 : this.currentStepIndex;
        this.updateProgressDisplay();
    }

    resetSession() {
        this.sessionId = null;
        this.currentStep = null;
        this.currentStepIndex = 0;
        this.totalSteps = 0;
        this.currentLessonTitle = '';
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

        this.updateLessonInfo();
    }

    clearMessages(showWelcome = true) {
        if (!showWelcome) {
            this.messagesContainer.innerHTML = '';
            return;
        }

        this.messagesContainer.innerHTML = `
            <div class="text-center text-muted-foreground py-8">
                <div class="text-4xl mb-4">👋</div>
                <p class="text-lg font-medium mb-2">¡Bienvenido al Docente IA!</p>
                <p>Selecciona una lección y haz clic en "Iniciar Sesión" para comenzar tu experiencia de aprendizaje.</p>
            </div>
        `;
    }

    updateProgressDisplay() {
        if (!this.sessionId) {
            this.currentStepDisplay.textContent = '-';
            this.progressDisplay.textContent = this.totalSteps ? `0/${this.totalSteps}` : '0/0';
            return;
        }

        if (this.totalSteps > 0) {
            const stepNumber = Math.min(this.currentStepIndex + 1, this.totalSteps);
            this.currentStepDisplay.textContent = `Paso ${stepNumber}`;
            this.progressDisplay.textContent = `${stepNumber}/${this.totalSteps}`;
        } else {
            this.currentStepDisplay.textContent = `Paso ${this.currentStepIndex + 1}`;
            this.progressDisplay.textContent = '-';
        }
    }

    setLoading(loading) {
        if (loading) {
            this.startSessionBtn.textContent = 'Iniciando...';
            this.startSessionBtn.disabled = true;
        } else {
            this.startSessionBtn.textContent = this.sessionId ? 'Nueva Sesión' : 'Iniciar Sesión';
            this.startSessionBtn.disabled = false;
        }
    }

    setProcessing(processing) {
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

    showError(message) {
        this.addMessage('system', `❌ ${message}`);
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new DocenteIAChat();
});
