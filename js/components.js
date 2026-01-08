/**
 * Component Generator Functions
 * Responsible for creating HTML templates for dynamic content.
 */

export function createStudentCard(student) {
    let statusColor = 'bg-green-100 text-green-800';
    let statusText = 'נוכח';
    let borderColor = 'border-gray-200';
    
    if (student.status === 'toilet') {
        statusColor = 'bg-orange-100 text-orange-800';
        statusText = 'בשירותים';
        borderColor = 'border-orange-300 ring-2 ring-orange-100';
    } else if (student.status === 'submitted') {
        statusColor = 'bg-gray-100 text-gray-500';
        statusText = 'הגיש/ה';
        borderColor = 'border-gray-200 opacity-75';
    }

    // Return the HTML Template Literal
    return `
        <div class="bg-white p-4 rounded-lg border ${borderColor} shadow-sm hover:shadow-md transition relative" data-id="${student.id}">
            <div class="flex justify-between items-start mb-3">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm">
                        ${student.image}
                    </div>
                    <div>
                        <h3 class="font-bold text-gray-800 text-sm">${student.name}</h3>
                        <span class="text-xs text-gray-400">ID: ${student.id}</span>
                    </div>
                </div>
                <span class="${statusColor} text-xs px-2 py-1 rounded-full font-medium">${statusText}</span>
            </div>
            
            <div class="flex justify-between items-center mt-2">
                <div class="text-xs text-gray-500">
                    ${student.status === 'toilet' ? `<span class="font-bold text-orange-600">בחוץ: ${student.timeInStatus} דק'</span>` : ''}
                </div>
                
                <div class="flex gap-1">
                     ${student.status === 'present' ? 
                        `<button class="action-btn text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded border border-orange-200 hover:bg-orange-100 transition" data-action="toilet" data-id="${student.id}">שירותים</button>` 
                        : ''}
                     ${student.status === 'toilet' ? 
                        `<button class="action-btn text-xs bg-green-50 text-green-600 px-2 py-1 rounded border border-green-200 hover:bg-green-100 transition" data-action="present" data-id="${student.id}">חזר</button>` 
                        : ''}
                </div>
            </div>
        </div>
    `;
}

export function createChatMessage(msg) {
    const isBot = msg.sender === 'bot';
    const alignClass = isBot ? 'items-start' : 'items-end';
    
    const bubbleClass = isBot 
        ? (msg.alert ? 'bg-red-50 border border-red-100 text-red-800' : 'bg-white border border-gray-200 text-gray-800') 
        : 'bg-blue-600 text-white';

    return `
        <div class="flex flex-col ${alignClass}">
            <div class="max-w-[85%] p-3 rounded-lg shadow-sm text-sm ${bubbleClass}">
                ${msg.alert ? '<div class="mb-1 text-red-600 flex items-center gap-1">⚠️ התראה</div>' : ''}
                ${msg.text}
            </div>
            <span class="text-[10px] text-gray-400 mt-1 px-1">${msg.time}</span>
        </div>
    `;
}