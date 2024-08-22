[button, input, technical_Img, financial_Img] = ['button', 'input', 'img#technical-analysis', 'img#financial-analysis'].map(selector => document.querySelector(selector));
button.addEventListener('click', () => {
    technical_Img.src = `/projects/tadawul/images/Technical_PNG/${input.value.trim()}.png`;
    financial_Img.src = `/projects/tadawul/images/Financial_PNG/${input.value.trim()}.png`;
    technical_Img.onerror = () => alert('Technical Analysis Not Found...');
    financial_Img.onerror = () => alert('Financial Analysis Not Found...');
});
input.addEventListener('keydown', e => e.key === 'Enter' && button.click());

[technical_Img, financial_Img].forEach(img => {
    img.addEventListener('click', () => {
        if (img.requestFullscreen) {
            img.requestFullscreen();
        }
    })
});