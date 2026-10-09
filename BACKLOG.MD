Se esconde el componente CERTIFICADOS cuando el salto queda entre medio de la página 1 y 2
. Como si quedara en el vacío, el componente entero, porqie detecta que no debe hacer le salto en la página 1, pero hace overflow, y la página 2 empieza con el siguiente componente de contenido, es como si quedara arrastado hastsa más abajo de los límites de la página 1, y nunca se recupera. (LISTO)

Se rompe al traducir de otros idiomas que no sea inglés -> español (LISTO)

EL prompt de entrevista tecnica no se entiende caundo mencionas las tecnologias ausentes. ENTREVISTA INVERSA, no se entiende. Ningun titulo se entiende MUHCO, DEBERIAN TODOS LOS PROMPTS como tono de habla, citar : utilizar como referencia de evitar palabras clave con: https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing (LISTO)

Al escribir texto libre opcional en el MODAL de prompts, no debe persistir el texto ingresado, una vez que se cambie de prompt en el selector, si se cierra el modal, eliminar todo el texto opcional ingresado. (LISTO)

En el selector de secciones, persistio el modo claro, lo cual no tiene sentido. El selector de estilos ANTES de seleccionar el elemnto, no tiene sentido. El selector dentro del compoennte, que utiliza o no la linea conectora, no sirve, simepre se esta mostrando linea conectopra (LISTO)

El componente de Idiomas no funciona bien, esta forzando un salto de linea despues del titulo en negrita. Las skills y otro scomponentes que son de lista simple, hacen lo mismo, tienen un texto en negrita, y un salto de linea, aunque el texto entre realmente en la misma linea, todos los compoenntes de lista simple estan con ese comportamiento. (LISTO)

CArgando vista previa demora muhcisimo en cargar, el primer renderizado ya deberia descargar de forma asincronica todas las fuentes posibles y cualquier asset involucrado en el proceso de descarga. EL usuario debe hacer click en descargar, y el navegador ya deberia tener listo todo para la descarga final. (LISTO)

AL editar texto, los botones de negrita y cursiva se resetean automaticamente, solo funciona con los atajos del teclado (LISTO)

Los tres primeros elementos que no pueden moverse, no deberian tener la manito de arrastre activada, o almenos tener visualmente un decorador distinto al hacer hover para senializar. 

EN el gestor de versiones, Se esta poniendo como ACTIVO una version guardada, pero no tiene sentido porque en el editor, si vas editando, ya no es el mismo documento ni al misma version, las ediciones en vivo estan BASADAS en la ultima version cargada, pero confunde al usuario. (LISTO)

#Nota: Contempla la UX, y lo que un usario comun sin conocimiento profundo del sistema entenderia, haz tests de Cypress con buen coverage. Un commit por cada feature.
