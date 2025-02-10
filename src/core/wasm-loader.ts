
export async function loadWasm(): Promise<WebAssembly.WebAssemblyInstantiatedSource> {
  try {
    // Adjust the path according to where your WASM file will be located
    const response = await fetch('emulator.wasm');
    const wasmBuffer = await response.arrayBuffer();
    const wasmModule = await WebAssembly.instantiate(wasmBuffer, {
      env: {
        memory: new WebAssembly.Memory({ initial: 256 }), // 16MB initial memory
        // Add any additional environment imports your WASM module needs here
      }
    });

    return wasmModule;
  } catch (error) {
    console.error('Failed to load WASM module:', error);
    throw new Error('Failed to initialize emulator');
  }
}
