const Pool = require("pg").Pool;
const pool = new Pool({
    user: 'postgres',
    host: '192.168.10.13',
    database: 'KC',
    password: 'Masteritnbi1',
    port: 5432
});

const pool2 = new Pool({
    user: 'postgres',
    host: '192.168.10.13',
    database: 'd_audit5r',
    password: 'Masteritnbi1',
    port: 5432
});

const pool3 = new Pool({
    user: 'postgres',
    host: '192.168.10.13',
    database: 'audit_dummy',
    password: 'Masteritnbi1',
    port: 5432
});

async function getDataDaily(des, table) {
    try {
        const res = await pool.query(
            `SELECT ${des} FROM ${table} WHERE trxtype='DAQA' and param='GROUP' ORDER BY inputdate DESC limit(1)`
        );
        return res.rows[0][des];
    } catch (err) {
        return err.stack;
    }
}

function getDataWA(periode,tipe) {
    try {
        const res = pool2.query(
            `select * from s_mst.tb_wa a left join s_mst.tb_user b on
            a.id_auditor=b.id_user left join s_mst.tb_jadwal c on
            a.id_auditor=c.auditor where c.periode='${periode}' and a.tipe='${tipe}'`
        );
        return res;
    } catch (err) {
        return err.stack;
    }
}

function getDataAuditieBySection(auditie) {
    try {
        const res = pool2.query(
            `select * from s_mst.tb_dept 
            where section='${auditie}'`
        );
        return res;
    } catch (err) {
        return err.stack;
    }
}

function getDataAuditorByKoor(id_auditor) {
    try {
        const res = pool2.query(
            `select nama_auditor from s_mst.tb_jadwal a left join s_mst.tb_map_auditor b on a.auditor=b.id_koor left join s_mst.tb_auditor c on b.id_auditor=c.id_auditor where a.auditor='${id_auditor}'`
        );
        return res;
    } catch (err) {
        return err.stack;
    }
}

function getDataJadwalPerUser(periode,no_wa) {
    try {
        const res = pool2.query(
            `select * from s_mst.tb_wa a left join s_mst.tb_user b on
            a.id_auditor=b.id_user left join s_mst.tb_jadwal c on
            a.id_auditor=c.auditor where c.periode='${periode}' and a.tipe='USER' and no_wa='${no_wa}'`
        );
        return res;
    } catch (err) {
        return err.stack;
    }
}

function updatePasswordUser(pass_encrypt,username,initVector,Securitykey) {
    try {
        const res = pool2.query(
            `UPDATE s_mst.tb_user_temp
            SET password='${pass_encrypt}'
            WHERE username='${username}'`
        );
        return res;
    } catch (err) {
        return err.stack;
    }
}

function getUserTemp(no_wa) {
    try {
        const res = pool2.query(
            `select * from s_mst.tb_wa a left join s_mst.tb_user_temp b on a.nama=b.username WHERE no_wa='${no_wa}'`
        );
        return res;
    } catch (err) {
        return err.stack;
    }
}

function getAllWa() {
    try {
        const res = pool3.query(
            `select * from s_mst.tb_wa WHERE tipe='USER'`
        );
        return res;
    } catch (err) {
        return err.stack;
    }
}

function getRanking(periode,area) {
    try {
        const res = pool3.query(
            `select * from s_mst.tb_ranking a left join s_mst.tb_dept b on a.dept_ranking=b.id_dept where periode_ranking='${periode}' and area_ranking='${area}' order by row_number asc`
        );
        return res;
    } catch (err) {
        return err.stack;
    }
}




module.exports = {
    getDataDaily,
    getDataWA,
    getDataAuditieBySection,
    getDataAuditorByKoor, 
    getDataJadwalPerUser,
    updatePasswordUser,
    getUserTemp,
    getAllWa,
    getRanking,
}