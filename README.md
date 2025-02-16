# BaldeBoyEmulator - React + TypeScript + Vite  

🚧 **This project is currently in development!** 🚧  

**BaldeBoyEmulator** is an upcoming **Game Boy Emulator** built using **React, TypeScript, and Vite**. The goal is to create a smooth, high-performance emulator with a clean and modern UI, supporting essential features like rendering, audio processing, and customizable controls.  

## 🚀 Planned Features  
- **Game Boy Emulation** – Frame execution, rendering, and ROM loading.  
- **React + Vite Setup** – Fast development with Hot Module Replacement (HMR).  
- **TailwindCSS Styling** – Modern, responsive UI design.  
- **Customizable Controls** – Users can toggle settings & controls as needed.  
- **Performance Optimization** – Efficient execution of game logic.  

---  

## 🛠️ Setting Up the Project  

> **Note:** Since this project is still under development, functionality may be incomplete or subject to change.  

1. **Clone the Repository:**  
   ```sh
   git clone https://github.com/your-repo/BaldeBoyEmulator.git
   cd BaldeBoyEmulator
   ```

2. **Install Dependencies:**  
   ```sh
   npm install
   ```

3. **Start the Development Server:**  
   ```sh
   npm run dev
   ```

---  

## 📌 ESLint Configuration  

To ensure clean and maintainable TypeScript code, ESLint is configured. If you are expanding it, consider enabling **type-aware linting rules**:  

### 1️⃣ Update `parserOptions`  
Modify `eslint.config.js` to ensure TypeScript references the correct files:  

```js
export default tseslint.config({
  languageOptions: {
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
```

### 2️⃣ Use Stricter Type Checking  
- Replace `tseslint.configs.recommended` with:  
  - `tseslint.configs.recommendedTypeChecked` (for type-aware linting)  
  - `tseslint.configs.strictTypeChecked` (for strict type checking)  
- Optionally, include stylistic rules:  
  ```js
  ...tseslint.configs.stylisticTypeChecked
  ```

### 3️⃣ Add React-Specific Linting  
Install the **React ESLint plugin**:  

```sh
npm install eslint-plugin-react --save-dev
```

Then, update `eslint.config.js`:  

```js
import react from 'eslint-plugin-react';

export default tseslint.config({
  settings: { react: { version: '18.3' } },
  plugins: {
    react,
  },
  rules: {
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
  },
});
```

---  

## 🎮 Emulator UI & Controls (Work in Progress)  

### ✅ **Planned UI Behavior**  
- The emulator screen will be wrapped inside:  
  ```tsx
  <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-b from-black via-black/95 to-black">
  ```
- **Settings & Controls Resizing Fixes**  
  - The settings panel will be adjusted to **fit correctly** within this layout.  
  - Users will be able to **toggle settings & controls** on/off dynamically during resizing to avoid distractions.  

---  

## 🔧 Contributing  

Since the project is in active development, contributions are welcome! If you want to help:  

1. Fork the repository  
2. Create a new feature branch  
3. Implement and test changes  
4. Submit a pull request with detailed notes  

---  

## 📜 License  
This project will be licensed under [MIT License](LICENSE) once completed.  

