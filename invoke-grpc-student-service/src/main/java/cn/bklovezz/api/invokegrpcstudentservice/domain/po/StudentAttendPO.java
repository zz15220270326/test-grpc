package cn.bklovezz.api.invokegrpcstudentservice.domain.po;

import lombok.Data;

@Data
public class StudentAttendPO {
    private Long attendId;

    private Long id;

    private Long attendDays;
}
