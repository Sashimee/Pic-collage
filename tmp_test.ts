import { useEditor } from './src/store/editorStore';

function test(){
  const src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO0AAf8AAAAASUVORK5CYII=';
  const store = useEditor.getState();
  store.addPhoto(src,100,100);
  let state = useEditor.getState();
  console.log('after add', state.elements.length);
  const id = state.elements[0].id;
  store.removeElement(id);
  state = useEditor.getState();
  console.log('after remove', state.elements.length);
}

test();
