module.exports = {
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint', 'import'],
    parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
    },
    root: true,
    ignorePatterns: ['dist', '.eslintrc.cjs'],
}
