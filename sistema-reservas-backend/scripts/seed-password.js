const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

async function main() {
    const prisma = new PrismaClient();

    try {
        const hash = await bcrypt.hash('Admin2026!', 12);

        const user = await prisma.usuario.update({
            where: { usuario_id: 2 },
            data: { password_hash: hash },
        });

        console.log('Updated user:', user.username);
        console.log('Hash:', hash);
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
