module.exports = {
    source: ['tokens/**/*.json'],
    platforms: {
        css: {
            transformGroup: 'css',
            buildPath: 'src/styles/tokens/',
            files: [{
                destination: 'variables.css',
                format: 'css/variables'
            }]
        },
        scss: {
            transformGroup: 'scss',
            buildPath: 'src/styles/',
            files: [{
                destination: '_tokens.scss',
                format: 'scss/variables'
            }]
        }
    }
}
