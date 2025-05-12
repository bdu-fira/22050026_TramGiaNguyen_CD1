declare module 'react-draft-wysiwyg';

declare module 'draft-js' {
  export class EditorState {
    static createEmpty(): EditorState;
    static createWithContent(content: ContentState): EditorState;
    static set(editorState: EditorState, options: any): EditorState;
    getCurrentContent(): ContentState;
  }
  
  export class ContentState {
    static createFromBlockArray(blocks: any, entityMap: any): ContentState;
    createEntity(type: string, mutability: string, data: any): ContentState;
    getLastCreatedEntityKey(): string;
    hasText(): boolean;
  }
  
  export function convertToRaw(contentState: ContentState): any;
  export function convertFromHTML(html: string): { contentBlocks: any, entityMap: any };
  
  export class AtomicBlockUtils {
    static insertAtomicBlock(editorState: EditorState, entityKey: string, character: string): EditorState;
  }
}

declare module 'draftjs-to-html' {
  export default function draftToHtml(rawContent: any): string;
}

declare module 'html-to-draftjs' {
  export default function htmlToDraft(html: string): { contentBlocks: any, entityMap: any };
} 