package cn.bklovezz.api.invokegrpcstudentservice.domain.po;

import lombok.Data;

@Data
public class StudentInfoPO {
    private Long id;

    private String name;

    private Integer age;

    private Short gender;
}
