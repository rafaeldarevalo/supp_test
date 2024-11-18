// Seleccionar todos los headers de acordeón
const accordionHeaders = document.querySelectorAll('.accordion-header');

// Añadir evento click a cada header
accordionHeaders.forEach((header, index) => {
    header.addEventListener('click', () => {
        // Obtener el contenido correspondiente a este header
        const accordionContent = document.querySelector(`.js-step-${index + 1}`);
        
        // Obtener la flecha de este header
        const currentArrow = header.querySelector('.js-arrow');
        
        // Toggle de la clase supp-hidden en el contenido
        if (accordionContent.classList.contains('supp-hidden')) {
            // Cerrar todos los demás acordeones primero
            // document.querySelectorAll('.accordion-content').forEach(content => {
            //     if (content !== accordionContent) {
            //         content.classList.add('supp-hidden');
            //         content.classList.remove('animate-fade-up');
            //     }
            // });
            
            // Rotar todas las flechas a su posición original con animación
            document.querySelectorAll('.js-arrow').forEach(arrow => {
                if(arrow !== currentArrow && arrow.classList.contains('rotate')) {
                    arrow.addEventListener('transitionend', function handler() {
                        arrow.removeEventListener('transitionend', handler);
                    });
                    arrow.classList.remove('rotate');
                }
            });

            // Abrir este acordeón
            accordionContent.classList.remove('supp-hidden');
            accordionContent.classList.add('animate-fade-up');
            
            // Rotar la flecha de este acordeón
            currentArrow.classList.add('rotate');

        } else {
            // Cerrar este acordeón
            accordionContent.classList.add('supp-hidden');
            accordionContent.classList.remove('animate-fade-up');
            
            // Volver la flecha a su posición original con animación
            currentArrow.addEventListener('transitionend', function handler() {
                currentArrow.removeEventListener('transitionend', handler);
            });
            currentArrow.classList.remove('rotate');
        }
    });
});