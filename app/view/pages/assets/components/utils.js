function formToJson(form) {
    const data = Object.fromEntries(new FormData(form));
    form.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        data[cb.name] = cb.checked;
    });
    return data;
}
function showMsg(elementId, text, type = 'success') {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = text;
    el.className = type === 'success' ? 'msg-success' : 'msg-error';
}

function toast(icon, title, text, timer = 3000) {
    return Swal.fire({
        icon,
        title,
        text,
        timer,
        timerProgressBar: true,
        showConfirmButton: false,
    });
}
function error(icon, title, text,) {
    return Swal.fire({
        icon,
        title,
        text,
        footer: "<a href=\"#\">Why do I have this issue?</a>"
    });
}