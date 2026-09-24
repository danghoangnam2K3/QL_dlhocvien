const { supabase } = require('../config/database');

/**
 * Middleware ghi nhận lịch sử thao tác (Audit Trail)
 * Chạy bất đồng bộ - KHÔNG block request chính
 */
const auditTrail = (action, entity) => {
  return async (req, res, next) => {
    // Lưu lại original json method để intercept response
    const originalJson = res.json.bind(res);
    
    res.json = function(body) {
      // Chỉ ghi log nếu request thành công (status 2xx)
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        const entityId = 
          req.params.id || 
          (body.data && (body.data.id || body.data[0]?.id)) || 
          null;

        // Ghi log bất đồng bộ - không await
        setImmediate(async () => {
          try {
            await supabase.from('audit_logs').insert({
              user_id: req.user.id,
              action: action,
              entity: entity,
              entity_id: entityId?.toString(),
              after_data: body.data || null,
              ip_address: req.ip || req.headers['x-forwarded-for'],
            });
          } catch (err) {
            // Ghi vào console nếu DB lỗi - không block business flow
            console.error('[AuditTrail] Lỗi ghi log:', err.message);
          }
        });
      }
      return originalJson(body);
    };

    next();
  };
};

/**
 * Hàm ghi log thủ công (dùng trong controller)
 */
const writeAuditLog = async ({ userId, action, entity, entityId, beforeData, afterData, ipAddress }) => {
  try {
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action,
      entity,
      entity_id: entityId?.toString(),
      before_data: beforeData || null,
      after_data: afterData || null,
      ip_address: ipAddress,
    });
  } catch (err) {
    console.error('[AuditTrail] Lỗi ghi log thủ công:', err.message);
  }
};

module.exports = { auditTrail, writeAuditLog };
