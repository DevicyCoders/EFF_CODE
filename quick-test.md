# Quick Test Guide for JScript9 Extension

## 1. From terminal (if you have VS Code installed):
```bash
cd /home/mupacif/EFF_CODE
code .
# Then press F5 in VS Code
```

## 2. Test these features in the new window:

### Open a JScript9 file:
- `/mnt/c/inetpub/wwwroot/12.0/customs/fidal-gh/efficy/serverjs/rpva/import/message.js`
- `/mnt/c/inetpub/wwwroot/12.0/customs/fidal-gh/efficy/serverjs/rpva/crm/documents.js`

### Try these actions:
1. **Hover** over `@import` statements - you should see tooltips
2. **Ctrl+Click** on `"custom/rpva/crm/mails"` - should open mails.js
3. **F12** on `Mails` in `Mails.saveMailFromRPVA()` - go to definition
4. **Check Problems panel** (View → Problems) - see any syntax issues

### What you should see:
- ✅ Import paths turn into clickable links
- ✅ Hover shows resolved file paths
- ✅ Warnings for unresolved imports
- ✅ ES6 syntax warnings (const, let, arrow functions)
