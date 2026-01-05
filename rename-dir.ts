import fs from 'fs';
import path from 'path';

const oldPath = path.join(process.cwd(), 'src', 'app', '(dashboard)');
const newPath = path.join(process.cwd(), 'src', 'app', 'dashboard');

if (fs.existsSync(oldPath)) {
    try {
        fs.renameSync(oldPath, newPath);
        console.log('Successfully renamed (dashboard) to dashboard');
    } catch (err) {
        console.error('Error renaming directory:', err);
    }
} else {
    console.log('(dashboard) directory not found at', oldPath);
}
