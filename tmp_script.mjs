import { useEditor } from './src/store/editorStore.js';
import { history, AddPhotoCommand, RemoveElementCommand } from './src/store/history.js';
// add a photo
const add = new AddPhotoCommand('data:image/png;base64,AAA',100,100);
history.exec(add);
let state = useEditor.getState();
console.log('len after add', state.elements.length);
const id = state.elements[0].id;
const rem = new RemoveElementCommand(id);
history.exec(rem);
state = useEditor.getState();
console.log('len after rem', state.elements.length);
"